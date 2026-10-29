'use strict';

const FINAL_STATUSES = new Set([
    'SUCCESS',
    'FAILED',
    'REVERSED'
]);

function normalizeStatus(status) {
    const value = String(status || '')
        .trim()
        .toUpperCase();

    if (
        ['SUCCESS', 'SUCCESSFUL', 'COMPLETED'].includes(value)
    ) {
        return 'SUCCESS';
    }

    if (
        ['FAILED', 'FAILURE', 'REJECTED'].includes(value)
    ) {
        return 'FAILED';
    }

    if (
        ['REVERSED', 'REVERSAL'].includes(value)
    ) {
        return 'REVERSED';
    }

    return 'PENDING';
}

function createMonnifyWalletReconciliation({
    transactionRepository,
    withdrawalService
}) {
    if (!transactionRepository) {
        throw new Error(
            'A transaction repository is required.'
        );
    }

    if (!withdrawalService) {
        throw new Error(
            'A withdrawal service is required.'
        );
    }

    async function processWebhook(event) {
        const body = event.eventData || event.data || {};

        const reference =
            body.paymentReference ||
            body.reference ||
            body.transactionReference;

        if (!reference) {
            throw new Error(
                'Webhook does not contain a transaction reference.'
            );
        }

        const status = normalizeStatus(
            body.status || event.eventType
        );

        /*
         * The withdrawal service must look up the existing
         * withdrawal using its internal reference.
         *
         * It must also verify that the provider event matches
         * the stored amount, currency and provider reference.
         */
        await withdrawalService.reconcileProviderEvent({
            reference,
            provider: 'monnify',
            providerStatus: status,
            providerData: body
        });

        return {
            reference,
            status
        };
    }

    async function reconcile(reference) {
        if (!reference) {
            throw new Error(
                'A withdrawal reference is required.'
            );
        }

        const result =
            await withdrawalService.reconcileWithdrawal(reference);

        return {
            reference,
            status: normalizeStatus(
                result.providerStatus
            ),
            final: FINAL_STATUSES.has(
                normalizeStatus(result.providerStatus)
            )
        };
    }

    return {
        processWebhook,
        reconcile
    };
}

module.exports = {
    createMonnifyWalletReconciliation,
    normalizeStatus
};
