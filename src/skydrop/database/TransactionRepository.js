'use strict';

const crypto = require('node:crypto');

const {
    TransactionStatus,
    assertValidStatus
} = require('../transactions/TransactionStatus');

class TransactionRepository {
    constructor(database) {
        if (!database || typeof database.query !== 'function') {
            throw new Error(
                'TransactionRepository requires a database connection.'
            );
        }

        this.database = database;
    }

    async create(transaction) {
        if (!transaction || !transaction.reference) {
            throw new Error(
                'A transaction reference is required.'
            );
        }

        assertValidStatus(transaction.status);

        const result = await this.database.query(
            `
            INSERT INTO skydrop_transactions (
                reference,
                user_id,
                type,
                amount,
                currency,
                status,
                provider,
                provider_reference,
                idempotency_key,
                metadata,
                created_at,
                updated_at,
                version
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING *
            `,
            [
                transaction.reference,
                transaction.userId,
                transaction.type,
                transaction.amount,
                transaction.currency,
                transaction.status,
                transaction.provider || null,
                transaction.providerReference || null,
                transaction.idempotencyKey || null,
                JSON.stringify(transaction.metadata || {}),
                transaction.createdAt || new Date().toISOString(),
                transaction.updatedAt || new Date().toISOString(),
                transaction.version || 1
            ]
        );

        return this.mapTransaction(result.rows[0]);
    }

    async findByReference(reference) {
        const result = await this.database.query(
            `
            SELECT *
            FROM skydrop_transactions
            WHERE reference = $1
            LIMIT 1
            `,
            [reference]
        );

        return result.rows.length
            ? this.mapTransaction(result.rows[0])
            : null;
    }

    async findByIdempotencyKey(idempotencyKey) {
        const result = await this.database.query(
            `
            SELECT *
            FROM skydrop_transactions
            WHERE idempotency_key = $1
            LIMIT 1
            `,
            [idempotencyKey]
        );

        return result.rows.length
            ? this.mapTransaction(result.rows[0])
            : null;
    }

    async update(reference, transaction, options = {}) {
        assertValidStatus(transaction.status);

        const expectedVersion = options.expectedVersion;

        if (!Number.isInteger(expectedVersion)) {
            throw new Error(
                'An expected transaction version is required.'
            );
        }

        const result = await this.database.query(
            `
            UPDATE skydrop_transactions
            SET
                status = $1,
                provider_reference = $2,
                metadata = $3,
                updated_at = $4,
                version = version + 1
            WHERE
                reference = $5
                AND version = $6
            RETURNING *
            `,
            [
                transaction.status,
                transaction.providerReference || null,
                JSON.stringify(transaction.metadata || {}),
                transaction.updatedAt || new Date().toISOString(),
                reference,
                expectedVersion
            ]
        );

        if (result.rows.length === 0) {
            const error = new Error(
                'Transaction was changed by another operation or does not exist.'
            );

            error.code = 'TRANSACTION_CONCURRENT_UPDATE';

            throw error;
        }

        return this.mapTransaction(result.rows[0]);
    }

    async listByUser(userId, options = {}) {
        const limit = Math.min(
            Math.max(Number(options.limit) || 20, 1),
            100
        );

        const offset = Math.max(
            Number(options.offset) || 0,
            0
        );

        const result = await this.database.query(
            `
            SELECT *
            FROM skydrop_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            `,
            [userId, limit, offset]
        );

        return result.rows.map((row) => {
            return this.mapTransaction(row);
        });
    }

    async recordHistory(event) {
        const result = await this.database.query(
            `
            INSERT INTO skydrop_transaction_history (
                event_id,
                transaction_reference,
                event_type,
                previous_status,
                status,
                source,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                event.eventId || crypto.randomUUID(),
                event.transactionReference,
                event.eventType,
                event.previousStatus || null,
                event.status || null,
                event.source || 'application',
                event.timestamp || new Date().toISOString()
            ]
        );

        return result.rows[0];
    }

    async getHistory(reference, options = {}) {
        const limit = Math.min(
            Math.max(Number(options.limit) || 50, 1),
            200
        );

        const offset = Math.max(
            Number(options.offset) || 0,
            0
        );

        const result = await this.database.query(
            `
            SELECT *
            FROM skydrop_transaction_history
            WHERE transaction_reference = $1
            ORDER BY created_at ASC
            LIMIT $2 OFFSET $3
            `,
            [reference, limit, offset]
        );

        return result.rows;
    }

    mapTransaction(row) {
        if (!row) {
            return null;
        }

        return {
            reference: row.reference,
            userId: row.user_id,
            type: row.type,
            amount: Number(row.amount),
            currency: row.currency,
            status: row.status,
            provider: row.provider,
            providerReference: row.provider_reference,
            idempotencyKey: row.idempotency_key,
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            version: row.version
        };
    }
}

module.exports = TransactionRepository;
