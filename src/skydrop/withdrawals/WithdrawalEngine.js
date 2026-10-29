'use strict';

const crypto = require('node:crypto');

function createWithdrawalEngine({
    walletService,
    transactionService,
    withdrawalGateway
}) {
    if (!walletService) {
        throw new Error('WalletService is required.');
    }

    if (!transactionService) {
        throw new Error('TransactionService is required.');
    }

    if (!withdrawalGateway) {
        throw new Error(
            'Withdrawal gateway is required.'
        );
    }

    async function requestWithdrawal({
        userId,
        amountNgn,
        bankCode,
        accountNumber,
        accountName,
        idempotencyKey
    }) {
        if (!userId) {
            throw new Error('Authentication is required.');
        }

        if (
            !Number.isFinite(amountNgn) ||
            amountNgn < Number(
                process.env.SKYDROP_MIN_WITHDRAWAL_NGN || 100
            )
        ) {
            throw new Error(
                'Withdrawal amount is below the permitted minimum.'
            );
        }

        if (
            !/^\d{10}$/.test(accountNumber || '')
        ) {
            throw new Error(
                'A valid 10-digit recipient account number is required.'
            );
        }

        if (!bankCode || !accountName) {
            throw new Error(
                'Verified bank account details are required.'
            );
        }

        if (
            process.env.SKYDROP_WITHDRAWALS_ENABLED !== 'true' ||
            process.env.SKYDROP_MONNIFY_WITHDRAWALS_ENABLED !== 'true'
        ) {
            throw new Error(
                'Withdrawals are currently disabled.'
            );
        }

        if (!idempotencyKey) {
            throw new Error(
                'An idempotency key is required.'
            );
        }

        /*
         * The TransactionService must implement atomic
         * idempotency and reserve/debit funds safely.
         *
         * The engine must not assume that checking the
         * balance and then separately deducting funds
         * is concurrency-safe.
         */
        const reference = `SDW-${crypto.randomUUID()}`;

        return transactionService.createWithdrawal({
            userId,
            reference,
            idempotencyKey,
            amountNgn,
            bankCode,
            accountNumber,
            accountName
        });
    }

    async function submitWithdrawal(withdrawal) {
        if (!withdrawal?.reference) {
            throw new Error(
                'A persisted withdrawal is required.'
            );
        }

        if (withdrawal.status !== 'PENDING') {
            return withdrawal;
        }

        /*
         * This operation must be protected by a durable
         * processing claim/lease in MongoDB.
         *
         * Do not send the same withdrawal twice when
         * another worker is already processing it.
         */
        const claim =
            await transactionService.claimWithdrawal(
                withdrawal.reference
            );

        if (!claim) {
            return transactionService.getByReference(
                withdrawal.reference
            );
        }

        try {
            const providerResult =
                await withdrawalGateway.initiateWithdrawal({
                    ...withdrawal,
                    narration: 'SkyDrop withdrawal'
                });

            return transactionService.recordProviderSubmission({
                reference: withdrawal.reference,
                provider: 'monnify',
                providerReference:
                    providerResult.providerReference,
                providerStatus:
                    providerResult.providerStatus
            });
        } catch (error) {
            /*
             * A network timeout is ambiguous: Monnify may
             * already have accepted the request.
             *
             * Preserve a reconcilable state instead of
             * blindly retrying or refunding the user.
             */
            await transactionService.markWithdrawalForReconciliation({
                reference: withdrawal.reference,
                reason: 'PROVIDER_RESULT_UNKNOWN'
            });

            throw error;
        }
    }

    return {
        requestWithdrawal,
        submitWithdrawal
    };
}

module.exports = {
    createWithdrawalEngine
};
