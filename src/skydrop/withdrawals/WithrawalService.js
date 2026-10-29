'use strict';

function createWithdrawalService({
    withdrawalEngine,
    withdrawalGateway,
    transactionService
}) {
    if (!withdrawalEngine) {
        throw new Error(
            'WithdrawalEngine is required.'
        );
    }

    if (!withdrawalGateway) {
        throw new Error(
            'WithdrawalGateway is required.'
        );
    }

    if (!transactionService) {
        throw new Error(
            'TransactionService is required.'
        );
    }

    async function requestWithdrawal(input) {
        const withdrawal =
            await withdrawalEngine.requestWithdrawal(input);

        if (withdrawal.status === 'PENDING') {
            await withdrawalEngine.submitWithdrawal(
                withdrawal
            );
        }

        return transactionService.getByReference(
            withdrawal.reference
        );
    }

    async function reconcileWithdrawal(reference) {
        const withdrawal =
            await transactionService.getByReference(
                reference
            );

        if (!withdrawal) {
            throw new Error('Withdrawal not found.');
        }

        const providerResult =
            await withdrawalGateway.reconcileWithdrawal(
                reference
            );

        return reconcileProviderEvent({
            reference,
            provider: providerResult.provider,
            providerStatus: providerResult.providerStatus,
            providerData: providerResult
        });
    }

    async function reconcileProviderEvent({
        reference,
        provider,
        providerStatus,
        providerData
    }) {
        if (provider !== 'monnify') {
            throw new Error(
                'Unsupported withdrawal provider.'
            );
        }

        const status = String(
            providerStatus || ''
        ).toUpperCase();

        /*
         * The transaction service owns status transitions,
         * wallet settlement, refunds, ledger entries,
         * duplicate-event protection and audit history.
         */
        return transactionService.reconcileWithdrawal({
            reference,
            provider,
            providerStatus: status,
            providerData
        });
    }

    async function getWithdrawal(reference, userId) {
        const withdrawal =
            await transactionService.getByReference(
                reference
            );

        if (!withdrawal) {
            return null;
        }

        if (
            String(withdrawal.userId) !==
            String(userId)
        ) {
            throw new Error('Access denied.');
        }

        return withdrawal;
    }

    return {
        requestWithdrawal,
        reconcileWithdrawal,
        reconcileProviderEvent,
        getWithdrawal
    };
}

module.exports = {
    createWithdrawalService
};
