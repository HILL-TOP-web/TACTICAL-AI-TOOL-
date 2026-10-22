'use strict';

const crypto = require('node:crypto');

class UserRepository {
    constructor(database) {
        if (!database || typeof database.query !== 'function') {
            throw new Error(
                'UserRepository requires a database connection.'
            );
        }

        this.database = database;
    }

    async create(user) {
        if (
            !user ||
            typeof user.id !== 'string' ||
            !user.id.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            typeof user.email !== 'string' ||
            !user.email.trim()
        ) {
            throw new Error('A valid email address is required.');
        }

        const normalizedEmail = user.email.trim().toLowerCase();

        const result = await this.database.query(
            `
            INSERT INTO skydrop_users (
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            `,
            [
                user.id,
                normalizedEmail,
                user.displayName || null,
                user.role || 'user',
                user.active !== false
            ]
        );

        return this.mapUser(result.rows[0]);
    }

    async findById(id) {
        const result = await this.database.query(
            `
            SELECT
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            FROM skydrop_users
            WHERE id = $1
            LIMIT 1
            `,
            [id]
        );

        return result.rows.length
            ? this.mapUser(result.rows[0])
            : null;
    }

    async findByEmail(email) {
        if (typeof email !== 'string' || !email.trim()) {
            throw new Error('A valid email address is required.');
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await this.database.query(
            `
            SELECT
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            FROM skydrop_users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        return result.rows.length
            ? this.mapUser(result.rows[0])
            : null;
    }

    async updateAccountStatus(id, active) {
        if (typeof active !== 'boolean') {
            throw new Error(
                'Account status must be a boolean.'
            );
        }

        const result = await this.database.query(
            `
            UPDATE skydrop_users
            SET
                active = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            `,
            [active, id]
        );

        if (!result.rows.length) {
            return null;
        }

        return this.mapUser(result.rows[0]);
    }

    async listUsers(options = {}) {
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
            SELECT
                id,
                email,
                display_name,
                role,
                active,
                created_at,
                updated_at
            FROM skydrop_users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );

        return result.rows.map((row) => {
            return this.mapUser(row);
        });
    }

    async recordSecurityEvent(event) {
        const result = await this.database.query(
            `
            INSERT INTO skydrop_security_audit (
                event_id,
                event_type,
                user_id,
                transaction_reference,
                source,
                outcome,
                metadata,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                event.eventId || crypto.randomUUID(),
                event.eventType,
                event.userId || null,
                event.transactionReference || null,
                event.source || 'application',
                event.outcome || 'unknown',
                JSON.stringify(event.metadata || {}),
                event.timestamp || new Date().toISOString()
            ]
        );

        return result.rows[0];
    }

    mapUser(row) {
        if (!row) {
            return null;
        }

        return {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            role: row.role,
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

module.exports = UserRepository;
