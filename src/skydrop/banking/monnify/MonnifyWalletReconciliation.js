'use strict';

const MonnifyFunding = require('./MonnifyFunding');
const MonnifyDisbursement = require('./MonnifyDisbursement');

class MonnifyWalletReconciliation {
    constructor(options = {}) {
        this.funding =
            options.funding ||
            new MonnifyFunding(options);

        this.disbursement =
            options.disbursement ||
            new MonnifyDisbursement({
                ...options,
                client: this.funding
            });

        this.reconciliationService =
            options.reconciliationService || null;
    }

    /**
     * Verify the provider connection.
     *
     * No money is moved by this check.
     */
    async checkConnection() {
        const result = await this.funding.checkConnection();

        return {
            provider: 'Monnify',
            connected: result.connected,
            authenticated: result.authenticated
        };
    }

    /**
     * Verify an incoming funding payment.
     *
     * The caller must compare the verified provider status,
     * payment reference, amount, currency and expected customer
     * or order against its own persistent database record.
     */
    async reconcileFunding(paymentReference, expected = {}) {
        const providerResult =
            await this.funding.verifyFunding(paymentReference);

        if (
            providerResult.requestSuccessful !== true ||
            !providerResult.responseBody
        ) {
            return {
                reconciled: false,
                status: 'unverified',
                reason: 'Provider verification was unsuccessful.'
            };
        }

        const body = providerResult.responseBody;

        const expectedAmount = Number(expected.amount);

        if (
            expected.amount !== undefined &&
            (
                !Number.isFinite(expectedAmount) ||
                expectedAmount <= 0
            )
        ) {
            throw new Error(
                'Expected funding amount must be a positive number.'
            );
        }

        const referenceMatches =
            body.paymentReference === paymentReference;

        const amountMatches =
            expected.amount === undefined ||
            (
                Number.isFinite(Number(body.amountPaid)) &&
                Number(body.amountPaid) === expectedAmount
            );

        const currencyMatches =
            expected.currency === undefined ||
            (
                body.currencyCode === expected.currency ||
                body.currency === expected.currency
            );

        const paid =
            body.paymentStatus === 'PAID';

        const verified =
            referenceMatches &&
            amountMatches &&
            currencyMatches &&
            paid;

        if (!verified) {
            return {
                reconciled: false,
                status: 'unverified',
                reason:
                    'Payment status or transaction details did not match.',
                checks: {
                    referenceMatches,
                    amountMatches,
                    currencyMatches,
                    paid
                }
            };
        }

        if (
            !this.reconciliationService ||
            typeof this.reconciliationService.reconcileFunding !==
                'function'
        ) {
            return {
                reconciled: false,
                status: 'verified-awaiting-database-reconciliation',
                paymentReference,
                amount: Number(body.amountPaid),
                currency: body.currencyCode || body.currency
            };
        }

        /*
         * The injected service must:
         * - Find the original funding record.
         * - Lock/update it transactionally.
         * - Enforce unique provider/payment references.
         * - Credit the user's wallet once only.
         * - Record an audit trail.
         */
        return this.reconciliationService.reconcileFunding({
            paymentReference,
            provider: 'Monnify',
            providerTransactionReference:
                body.transactionReference,
            amount: Number(body.amountPaid),
            currency: body.currencyCode || body.currency,
            providerStatus: body.paymentStatus
        });
    }

    /**
     * Retrieve the latest provider status for an outgoing transfer.
     *
     * Provider status alone must not be used to credit or debit
     * a wallet without reconciling the original transaction.
     */
    async reconcileDisbursement(reference) {
        const providerResult =
            await this.disbursement.getTransferStatus(reference);

        if (
            !providerResult ||
            providerResult.requestSuccessful !== true
        ) {
            return {
                reconciled: false,
                status: 'unverified',
                reference
            };
        }

        if (
            !this.reconciliationService ||
            typeof this.reconciliationService.reconcileDisbursement !==
                'function'
        ) {
            return {
                reconciled: false,
                status: 'verified-awaiting-database-reconciliation',
                reference,
                providerResult
            };
        }

        /*
         * The persistent reconciliation service must interpret
         * the exact provider response schema and enforce valid
         * status transitions, idempotency and wallet accounting.
         */
        return this.reconciliationService.reconcileDisbursement({
            reference,
            provider: 'Monnify',
            providerResult
        });
    }
}

module.exports = MonnifyWalletReconciliation;
