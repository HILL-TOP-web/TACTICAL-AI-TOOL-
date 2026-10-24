'use strict';

const crypto = require('crypto');

class TransferRepository {
    constructor() {
        this.transfers = new Map();
        this.idempotencyKeys = new Map();
    }

    /**
     * Create a transfer record.
     *
     * This repository does not send money or confirm
     * that a payment provider completed a transfer.
     */
    async create(transferData) {
        if (
            !transferData ||
            typeof transferData !== 'object' ||
            Array.isArray(transferData)
        ) {
            throw new Error('Invalid transfer record.');
        }

        const {
            userId,
            recipientAccountNumber,
            recipientBankCode,
            recipientName,
            amount,
            currency,
            idempotencyKey
        } = transferData;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            throw new Error('A valid transfer amount is required.');
        }

        if (idempotencyKey) {
            const existingId =
                this.idempotencyKeys.get(
                    `${userId}:${idempotencyKey}`
                );

            if (existingId) {
                return this.getById(existingId, userId);
            }
        }

        const now = new Date().toISOString();

        const transfer = {
            id: crypto.randomUUID(),
            userId: userId.trim(),
            recipientAccountNumber,
            recipientBankCode,
            recipientName,
            amount: Number(amount),
            currency: currency || 'NGN',
            status: 'pending',
            providerReference: null,
            failureCode: null,
            idempotencyKey: idempotencyKey || null,
            createdAt: now,
            updatedAt: now
        };

        this.transfers.set(transfer.id, transfer);

        if (idempotencyKey) {
            this.idempotencyKeys.set(
                `${userId}:${idempotencyKey}`,
                transfer.id
            );
        }

        return this.sanitize(transfer);
    }

    /**
     * Retrieve a transfer by ID.
     * If userId is supplied, ownership is also checked.
     */
    async getById(transferId, userId) {
        const transfer = this.transfers.get(transferId);

        if (!transfer) {
            return null;
        }

        if (userId && transfer.userId !== userId) {
            return null;
        }

        return this.sanitize(transfer);
    }

    /**
     * Retrieve transfers belonging to one user.
     */
    async getByUserId(userId, options = {}) {
        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        const limit = options.limit === undefined
            ? 20
            : Number(options.limit);

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            throw new Error(
                'Limit must be an integer between 1 and 100.'
            );
        }

        let records = Array.from(this.transfers.values())
            .filter((transfer) => transfer.userId === userId)
            .sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
            );

        if (options.cursor) {
            const cursorIndex = records.findIndex(
                (transfer) => transfer.id === options.cursor
            );

            if (cursorIndex === -1) {
                throw new Error(
                    'Invalid transfer history cursor.'
                );
            }

            records = records.slice(cursorIndex + 1);
        }

        const page = records.slice(0, limit);
        const hasMore = records.length > limit;

        return {
            items: page.map((transfer) => this.sanitize(transfer)),
            nextCursor: hasMore
                ? page[page.length - 1].id
                : null
        };
    }

    /**
     * Update transfer status after an authorized service
     * has checked the appropriate provider result.
     *
     * Production implementations must enforce transitions
     * atomically and reconcile authoritative provider status.
     */
    async updateStatus(
        transferId,
        nextStatus,
        details = {}
    ) {
        const transfer = this.transfers.get(transferId);

        if (!transfer) {
            throw new Error('Transfer not found.');
        }

        const allowedStatuses = [
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled'
        ];

        if (!allowedStatuses.includes(nextStatus)) {
            throw new Error('Invalid transfer status.');
        }

        const allowedTransitions = {
            pending: ['processing', 'failed', 'cancelled'],
            processing: ['completed', 'failed'],
            completed: [],
            failed: [],
            cancelled: []
        };

        if (
            !allowedTransitions[transfer.status].includes(nextStatus)
        ) {
            throw new Error(
                `Invalid transfer status transition: ${transfer.status} -> ${nextStatus}.`
            );
        }

        transfer.status = nextStatus;
        transfer.updatedAt = new Date().toISOString();

        if (details.providerReference !== undefined) {
            transfer.providerReference =
                details.providerReference;
        }

        if (details.failureCode !== undefined) {
            transfer.failureCode = details.failureCode;
        }

        this.transfers.set(transferId, transfer);

        return this.sanitize(transfer);
    }

    /**
     * Remove sensitive recipient details from returned records.
     */
    sanitize(transfer) {
        if (!transfer) {
            return null;
        }

        const {
            id,
            userId,
            recipientAccountNumber,
            recipientBankCode,
            recipientName,
            amount,
            currency,
            status,
            providerReference,
            failureCode,
            createdAt,
            updatedAt
        } = transfer;

        return {
            id,
            userId,
            recipientAccountNumber:
                recipientAccountNumber
                    ? `******${recipientAccountNumber.slice(-4)}`
                    : null,
            recipientBankCode,
            recipientName,
            amount,
            currency,
            status,
            providerReference,
            failureCode,
            createdAt,
            updatedAt
        };
    }
}

module.exports = TransferRepository;
