'use strict';

const {
    getDisbursementStatus
} = require('./MonnifyDisbursement');

function normalizeStatus(value) {
    const status = String(value || '').toUpperCase();

    if (
        ['SUCCESS', 'COMPLETED', 'PAID'].includes(status)
    ) {
        return 'SUCCESS';
    }

    if (
        ['FAILED', 'REJECTED'].includes(status)
    ) {
        return 'FAILED';
    }

    if (status === 'REVERSED') {
        return 'REVERSED';
    }

    if (
        [
            'PENDING',
            'PROCESSING',
            'PENDING_AUTHORIZATION'
        ].includes(status)
    ) {
        return 'PROCESSING';
    }

    return 'UNKNOWN';
}

async function reconcileDisbursement({
    reference,
    transactionService,
    withdrawalRepository,
    transferRepository
}) {
    if (!reference) {
        throw new Error('reference is required.');
    }

    const provider = await getDisbursementStatus(reference);

    const status = normalizeStatus(provider.status);

    const fields = {
        providerStatus: provider.status || 'UNKNOWN',

        providerTransactionReference:
            provider.transactionReference || null,

        reconciledAt: new Date()
    };

    const results = {};

    if (
        withdrawalRepository &&
        typeof withdrawalRepository
            .updateByProviderReference === 'function'
    ) {
        results.withdrawal =
            await withdrawalRepository
                .updateByProviderReference(
                    reference,
                    status,
                    fields
                );
    }

    if (
        transferRepository &&
        typeof transferRepository
            .updateByProviderReference === 'function'
    ) {
        results.transfer =
            await transferRepository
                .updateByProviderReference(
                    reference,
                    status,
                    fields
                );
    }

    if (
        transactionService &&
        typeof transactionService
            .updateByProviderReference === 'function'
    ) {
        results.transaction =
            await transactionService
                .updateByProviderReference(
                    reference,
                    status,
                    fields
                );
    }

    return {
        reference,
        status,
        providerStatus: provider.status || 'UNKNOWN',
        results
    };
}

module.exports = {
    reconcileDisbursement,
    normalizeStatus
};
