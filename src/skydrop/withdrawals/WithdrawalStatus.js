'use strict';

const WithdrawalStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    REQUIRES_RECONCILIATION: 'requires_reconciliation'
});

const TERMINAL_STATUSES = new Set([
    WithdrawalStatus.COMPLETED,
    WithdrawalStatus.FAILED,
    WithdrawalStatus.REJECTED,
    WithdrawalStatus.CANCELLED
]);

const ALLOWED_TRANSITIONS = Object.freeze({
    [WithdrawalStatus.PENDING]: [
        WithdrawalStatus.PROCESSING,
        WithdrawalStatus.REJECTED,
        WithdrawalStatus.CANCELLED
    ],

    [WithdrawalStatus.PROCESSING]: [
        WithdrawalStatus.AWAITING_CONFIRMATION,
        WithdrawalStatus.COMPLETED,
        WithdrawalStatus.FAILED,
        WithdrawalStatus.REQUIRES_RECONCILIATION
    ],

    [WithdrawalStatus.AWAITING_CONFIRMATION]: [
        WithdrawalStatus.COMPLETED,
        WithdrawalStatus.FAILED,
        WithdrawalStatus.REQUIRES_RECONCILIATION
    ],

    [WithdrawalStatus.REQUIRES_RECONCILIATION]: [
        WithdrawalStatus.AWAITING_CONFIRMATION,
        WithdrawalStatus.COMPLETED,
        WithdrawalStatus.FAILED
    ],

    [WithdrawalStatus.COMPLETED]: [],
    [WithdrawalStatus.FAILED]: [],
    [WithdrawalStatus.REJECTED]: [],
    [WithdrawalStatus.CANCELLED]: []
});

class WithdrawalStatusManager {
    static isValid(status) {
        return Object.values(WithdrawalStatus).includes(status);
    }

    static isTerminal(status) {
        return TERMINAL_STATUSES.has(status);
    }

    static canTransition(currentStatus, nextStatus) {
        if (
            !this.isValid(currentStatus) ||
            !this.isValid(nextStatus)
        ) {
            return false;
        }

        return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
    }

    static assertTransition(currentStatus, nextStatus) {
        if (!this.canTransition(currentStatus, nextStatus)) {
            throw new Error(
                `Invalid withdrawal status transition: ${currentStatus} -> ${nextStatus}`
            );
        }
    }

    static getAll() {
        return Object.values(WithdrawalStatus);
    }
}

module.exports = WithdrawalStatus;

module.exports.WithdrawalStatusManager = WithdrawalStatusManager;
module.exports.TERMINAL_STATUSES = TERMINAL_STATUSES;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
