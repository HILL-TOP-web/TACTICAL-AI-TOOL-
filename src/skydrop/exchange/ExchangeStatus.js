'use strict';

class ExchangeStatus {
    static get STATUS() {
        return Object.freeze({
            PENDING: 'pending',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            FAILED: 'failed',
            CANCELLED: 'cancelled'
        });
    }

    static get ALLOWED_TRANSITIONS() {
        return Object.freeze({
            pending: Object.freeze([
                'processing',
                'failed',
                'cancelled'
            ]),

            processing: Object.freeze([
                'completed',
                'failed'
            ]),

            completed: Object.freeze([]),

            failed: Object.freeze([]),

            cancelled: Object.freeze([])
        });
    }

    static isValid(status) {
        return Object.values(this.STATUS).includes(status);
    }

    static assertValid(status) {
        if (!this.isValid(status)) {
            throw new Error(
                `Invalid exchange status: ${status}`
            );
        }

        return true;
    }

    static canTransition(currentStatus, nextStatus) {
        this.assertValid(currentStatus);
        this.assertValid(nextStatus);

        return this.ALLOWED_TRANSITIONS[
            currentStatus
        ].includes(nextStatus);
    }

    static transition(currentStatus, nextStatus) {
        this.assertValid(currentStatus);
        this.assertValid(nextStatus);

        if (
            !this.canTransition(
                currentStatus,
                nextStatus
            )
        ) {
            throw new Error(
                `Invalid exchange status transition: ` +
                `${currentStatus} -> ${nextStatus}`
            );
        }

        return nextStatus;
    }

    static isPending(status) {
        this.assertValid(status);

        return status === this.STATUS.PENDING;
    }

    static isProcessing(status) {
        this.assertValid(status);

        return status === this.STATUS.PROCESSING;
    }

    static isCompleted(status) {
        this.assertValid(status);

        return status === this.STATUS.COMPLETED;
    }

    static isFailed(status) {
        this.assertValid(status);

        return status === this.STATUS.FAILED;
    }

    static isCancelled(status) {
        this.assertValid(status);

        return status === this.STATUS.CANCELLED;
    }

    static isTerminal(status) {
        this.assertValid(status);

        return [
            this.STATUS.COMPLETED,
            this.STATUS.FAILED,
            this.STATUS.CANCELLED
        ].includes(status);
    }

    static canRetry(status) {
        this.assertValid(status);

        return status === this.STATUS.FAILED;
    }

    static getDescription(status) {
        this.assertValid(status);

        const descriptions = {
            pending: 'Exchange request is awaiting processing.',
            processing: 'Exchange request is being processed.',
            completed: 'Exchange request has completed.',
            failed: 'Exchange request failed.',
            cancelled: 'Exchange request was cancelled.'
        };

        return descriptions[status];
    }

    static getAll() {
        return Object.values(this.STATUS);
    }
}

module.exports = ExchangeStatus;
