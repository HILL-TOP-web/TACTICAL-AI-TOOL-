'use strict';

const WithdrawalStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESSFUL: 'successful',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REVERSED: 'reversed'
});

const TERMINAL_STATUSES = new Set([
    WithdrawalStatus.SUCCESSFUL,
    WithdrawalStatus.FAILED,
    WithdrawalStatus.CANCELLED,
    WithdrawalStatus.REVERSED
]);

const ALLOWED_TRANSITIONS = Object.freeze({
    [WithdrawalStatus.PENDING]: new Set([
        WithdrawalStatus.PROCESSING,
        WithdrawalStatus.SUCCESSFUL,
        WithdrawalStatus.FAILED,
        WithdrawalStatus.CANCELLED
    ]),

    [WithdrawalStatus.PROCESSING]: new Set([
        WithdrawalStatus.SUCCESSFUL,
        WithdrawalStatus.FAILED,
        WithdrawalStatus.REVERSED
    ]),

    [WithdrawalStatus.SUCCESSFUL]: new Set([
        WithdrawalStatus.REVERSED
    ]),

    [WithdrawalStatus.FAILED]: new Set([]),

    [WithdrawalStatus.CANCELLED]: new Set([]),

    [WithdrawalStatus.REVERSED]: new Set([])
});

function canTransition(currentStatus, nextStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];

    return Boolean(
        allowed && allowed.has(nextStatus)
    );
}

function isTerminal(status) {
    return TERMINAL_STATUSES.has(status);
}

module.exports = {
    ...WithdrawalStatus,
    canTransition,
    isTerminal
};
