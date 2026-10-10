'use strict';

const crypto = require('node:crypto');

class ExchangeRepository {
    constructor(options = {}) {
        this.clock = options.clock || (() => Date.now());

        this.transactions = new Map();
        this.idempotencyKeys = new Map();
    }

    async create(transaction) {
        if (
            !transaction ||
            typeof transaction !== 'object'
        ) {
            throw new Error(
                'Transaction record is required.'
            );
        }

        if (
            typeof transaction.transactionId !== 'string' ||
            !transaction.transactionId.trim()
        ) {
            throw new Error(
                'Transaction ID is required.'
            );
        }

        const id = transaction.transactionId;

        if (this.transactions.has(id)) {
            throw new Error(
                'Transaction already exists.'
            );
        }

        const idempotencyKey =
            transaction.idempotencyKey;

        if (idempotencyKey) {
            const existingId =
                this.idempotencyKeys.get(idempotencyKey);

            if (existingId) {
                throw new Error(
                    'Idempotency key already exists.'
                );
            }

            this.idempotencyKeys.set(
                idempotencyKey,
                id
            );
        }

        const now = this.clock();

        const record = {
            ...transaction,
            status: transaction.status || 'pending',
            createdAt: transaction.createdAt || now,
            updatedAt: now
        };

        this.transactions.set(
            id,
            structuredClone(record)
        );

        return structuredClone(record);
    }

    async findById(transactionId) {
        const record =
            this.transactions.get(transactionId);

        return record
            ? structuredClone(record)
            : null;
    }

    async findByIdempotencyKey(key) {
        const transactionId =
            this.idempotencyKeys.get(key);

        if (!transactionId) {
            return null;
        }

        return this.findById(transactionId);
    }

    async updateStatus(
        transactionId,
        status,
        details = {}
    ) {
        const record =
            this.transactions.get(transactionId);

        if (!record) {
            throw new Error(
                'Transaction not found.'
            );
        }

        const allowedStatuses = new Set([
            'pending',
            'processing',
            'completed',
            'failed',
            'reconciliation_required'
        ]);

        if (!allowedStatuses.has(status)) {
            throw new Error(
                'Invalid transaction status.'
            );
        }

        record.status = status;
        record.updatedAt = this.clock();

        if (details.errorCode) {
            record.errorCode = details.errorCode;
        }

        this.transactions.set(
            transactionId,
            record
        );

        return structuredClone(record);
    }

    async listByUser(userId, options = {}) {
        const limit = options.limit ?? 50;
        const offset = options.offset ?? 0;

        if (
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 500
        ) {
            throw new Error(
                'Limit must be between 1 and 500.'
            );
        }

        if (
            !Number.isSafeInteger(offset) ||
            offset < 0
        ) {
            throw new Error(
                'Offset must be a non-negative integer.'
            );
        }

        return Array.from(this.transactions.values())
            .filter(record => record.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(offset, offset + limit)
            .map(record => structuredClone(record));
    }

    async findByReference(reference) {
        const record = Array.from(
            this.transactions.values()
        ).find(transaction =>
            transaction.transactionId === reference
        );

        return record
            ? structuredClone(record)
            : null;
    }

    async appendEntry(entry) {
        if (
            !entry ||
            typeof entry !== 'object'
        ) {
            throw new Error(
                'Ledger entry is required.'
            );
        }

        if (
            typeof entry.transactionId !== 'string' ||
            !entry.transactionId.trim()
        ) {
            throw new Error(
                'Ledger transaction ID is required.'
            );
        }

        const existing = await this.findByReference(
            entry.transactionId
        );

        if (existing) {
            return existing;
        }

        const ledgerEntry = {
            ...entry,
            entryId: entry.entryId || crypto.randomUUID(),
            createdAt: entry.createdAt || this.clock()
        };

        /*
         * Development-only implementation.
         * Replace with an append-only persistent ledger table.
         */
        this.transactions.set(
            ledgerEntry.transactionId,
            structuredClone(ledgerEntry)
        );

        return structuredClone(ledgerEntry);
    }
}

module.exports = ExchangeRepository;
