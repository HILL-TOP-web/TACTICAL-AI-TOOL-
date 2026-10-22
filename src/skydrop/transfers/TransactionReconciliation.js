'use strict';

const {
    TransactionStatus,
    assertTransition
} = require('./TransactionStatus');

class TransactionReconciliation {
    constructor(options = {}) {
        const {
            transactionManager,
            monnifyClient,
            history = null,
            clock = () => new Date()
        } = options;

        if (!transactionManager) {
            throw new Error(
                'TransactionReconciliation requires TransactionManager.'
            );
        }

        if (
            !monnifyClient ||
            typeof monnifyClient.verifyTransaction !== 'function'
        ) {
            throw new Error(
                'A Monnify client with verifyTransaction() is required.'
            );
        }

        this.transactionManager = transactionManager;
        this.monnifyClient = monnifyClient;
        this.history = history;
        this.clock = clock;
    }

    async checkEnvironment() {
        const requiredVariables = [
            'MONNIFY_BASE_URL',
            'MONNIFY_API_KEY',
            'MONNIFY_SECRET_KEY',
            'MONNIFY_CONTRACT_CODE'
        ];

        const missing = requiredVariables.filter((name) => {
            return (
                typeof process.env[name] !== 'string' ||
                process.env[name].trim() === ''
            );
        });

        /*
         * Report variable NAMES only.
         * Never print their values.
         */
        return {
            valid: missing.length === 0,
            missingVariables: missing
        };
    }

    async reconcileMonnifyTransaction(reference) {
        const environment = await this.checkEnvironment();

        if (!environment.valid) {
            const error = new Error(
                'Monnify configuration is incomplete. ' +
                'Check the backend .env configuration.'
            );

            error.code = 'MONNIFY_ENV_INVALID';

            error.missingVariables = environment.missingVariables;

            throw error;
        }

        const transaction =
            await this.transactionManager.getTransaction(reference);

        if (transaction.provider !== 'monnify') {
            throw new Error(
                'This transaction is not registered with Monnify.'
            );
        }

        const providerReference = transaction.providerReference;

        if (
            typeof providerReference !== 'string' ||
            providerReference.trim() === ''
        ) {
            throw new Error(
                'Monnify provider reference is missing.'
            );
        }

        /*
         * This method must make a real server-side provider verification
         * request through the existing Monnify integration.
         *
         * A local database record alone is not proof of payment.
         */
        const result = await this.monnifyClient.verifyTransaction({
            transactionReference: providerReference
        });

        if (!result || result.verified !== true) {
            return {
                reconciled: false,
                reference,
                status: transaction.status,
                reason: 'Provider verification was not successful.'
            };
        }

        /*
         * Require explicit confirmation of the fields that connect
         * the provider transaction to the SkyDrop transaction.
         *
         * The adapter must derive these values from verified provider
         * information, not from an untrusted client request.
         */
        if (
            result.provider !== 'monnify' ||
            result.providerReference !== providerReference
        ) {
            return this.flagForReview(
                transaction,
                'Provider identity or reference mismatch.'
            );
        }

        if (
            result.amount !== transaction.amount ||
            String(result.currency).toUpperCase() !==
                String(transaction.currency).toUpperCase()
        ) {
            return this.flagForReview(
                transaction,
                'Provider amount or currency does not match.'
            );
        }

        if (
            result.internalReference !== transaction.reference
        ) {
            return this.flagForReview(
                transaction,
                'Internal transaction reference does not match.'
            );
        }

        if (result.status === 'pending') {
            return {
                reconciled: false,
                reference,
                status: transaction.status,
                providerStatus: 'pending',
                reason: 'Monnify has not confirmed a final result.'
            };
        }

        if (result.status === 'processing') {
            if (
                transaction.status !== TransactionStatus.PROCESSING
            ) {
                assertTransition(
                    transaction.status,
                    TransactionStatus.PROCESSING
                );

                await this.transactionManager.updateStatus(
                    reference,
                    TransactionStatus.PROCESSING,
                    {
                        source: 'monnify_reconciliation'
                    }
                );
            }

            return {
                reconciled: true,
                reference,
                status: TransactionStatus.PROCESSING
            };
        }

        if (result.status === 'successful') {
            const updated =
                await this.transactionManager.updateStatus(
                    reference,
                    TransactionStatus.SUCCESSFUL,
                    {
                        source: 'monnify_reconciliation',
                        providerReference,
                        providerVerified: true
                    }
                );

            if (this.history) {
                await this.history.recordEvent({
                    transactionReference: reference,
                    eventType: 'monnify_transaction_verified',
                    status: TransactionStatus.SUCCESSFUL,
                    source: 'monnify_reconciliation',
                    timestamp: this.clock().toISOString()
                });
            }

            return {
                reconciled: true,
                reference,
                status: updated.status
            };
        }

        if (result.status === 'failed') {
            const updated =
                await this.transactionManager.updateStatus(
                    reference,
                    TransactionStatus.FAILED,
                    {
                        source: 'monnify_reconciliation',
                        reason: 'Provider confirmed failure.'
                    }
                );

            return {
                reconciled: true,
                reference,
                status: updated.status
            };
        }

        if (result.status === 'reversed') {
            const updated =
                await this.transactionManager.updateStatus(
                    reference,
                    TransactionStatus.REVERSED,
                    {
                        source: 'monnify_reconciliation',
                        reason: 'Provider confirmed reversal.'
                    }
                );

            return {
                reconciled: true,
                reference,
                status: updated.status
            };
        }

        return this.flagForReview(
            transaction,
            'Unrecognized provider status.'
        );
    }

    async flagForReview(transaction, reason) {
        if (
            transaction.status !== TransactionStatus.REQUIRES_REVIEW
        ) {
            await this.transactionManager.updateStatus(
                transaction.reference,
                TransactionStatus.REQUIRES_REVIEW,
                {
                    source: 'monnify_reconciliation',
                    reason
                }
            );
        }

        if (this.history) {
            await this.history.recordEvent({
                transactionReference: transaction.reference,
                eventType: 'transaction_flagged_for_review',
                status: TransactionStatus.REQUIRES_REVIEW,
                source: 'monnify_reconciliation',
                timestamp: this.clock().toISOString()
            });
        }

        return {
            reconciled: false,
            reference: transaction.reference,
            status: TransactionStatus.REQUIRES_REVIEW,
            reason
        };
    }
}

module.exports = TransactionReconciliation;
