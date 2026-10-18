'use strict';

const PayoutStatus = Object.freeze({
    PENDING: 'PENDING',

    IN_PROGRESS: 'IN_PROGRESS',

    SUCCESS: 'SUCCESS',

    FAILED: 'FAILED',

    REVERSED: 'REVERSED'
});

function normalizeProviderStatus(status) {
    const value = String(status || '')
        .trim()
        .toUpperCase();

    if (
        ['SUCCESS', 'COMPLETED'].includes(value)
    ) {
        return PayoutStatus.SUCCESS;
    }

    if (
        ['FAILED', 'FAILURE'].includes(value)
    ) {
        return PayoutStatus.FAILED;
    }

    if (
        ['REVERSED', 'REVERSAL'].includes(value)
    ) {
        return PayoutStatus.REVERSED;
    }

    if (
        ['IN_PROGRESS', 'PROCESSING'].includes(value)
    ) {
        return PayoutStatus.IN_PROGRESS;
    }

    return PayoutStatus.PENDING;
}

module.exports = {
    PayoutStatus,
    normalizeProviderStatus
};
