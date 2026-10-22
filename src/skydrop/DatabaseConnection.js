'use strict';

const { Pool } = require('pg');

const REQUIRED_DATABASE_VARIABLES = Object.freeze([
    'DATABASE_URL'
]);

const REQUIRED_MONNIFY_VARIABLES = Object.freeze([
    'MONNIFY_BASE_URL',
    'MONNIFY_API_KEY',
    'MONNIFY_SECRET_KEY',
    'MONNIFY_CONTRACT_CODE'
]);

function checkEnvironmentVariables(requiredVariables) {
    const missing = requiredVariables.filter((name) => {
        const value = process.env[name];

        return (
            typeof value !== 'string' ||
            value.trim().length === 0
        );
    });

    return {
        valid: missing.length === 0,
        missingVariables: missing
    };
}

function checkDatabaseEnvironment() {
    return checkEnvironmentVariables(
        REQUIRED_DATABASE_VARIABLES
    );
}

function checkMonnifyEnvironment() {
    return checkEnvironmentVariables(
        REQUIRED_MONNIFY_VARIABLES
    );
}

function checkApplicationEnvironment() {
    const database = checkDatabaseEnvironment();
    const monnify = checkMonnifyEnvironment();

    return {
        valid: database.valid && monnify.valid,
        database,
        monnify
    };
}

function validateDatabaseUrl(databaseUrl) {
    if (
        typeof databaseUrl !== 'string' ||
        databaseUrl.trim() === ''
    ) {
        throw new Error('DATABASE_URL is required.');
    }

    let parsed;

    try {
        parsed = new URL(databaseUrl);
    } catch {
        throw new Error(
            'DATABASE_URL must be a valid PostgreSQL connection URL.'
        );
    }

    if (
        parsed.protocol !== 'postgres:' &&
        parsed.protocol !== 'postgresql:'
    ) {
        throw new Error(
            'DATABASE_URL must use postgres:// or postgresql://.'
        );
    }

    return true;
}

class DatabaseConnection {
    constructor(options = {}) {
        const environment = checkDatabaseEnvironment();

        if (!environment.valid) {
            throw new Error(
                'Database configuration is incomplete. Missing: ' +
                environment.missingVariables.join(', ')
            );
        }

        validateDatabaseUrl(process.env.DATABASE_URL);

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,

            max: options.maxConnections || 10,

            idleTimeoutMillis: options.idleTimeoutMillis || 30000,

            connectionTimeoutMillis:
                options.connectionTimeoutMillis || 5000,

            ssl: options.ssl
        });

        this.pool.on('error', () => {
            /*
             * Do not print connection strings or credentials.
             * Send sanitized diagnostics to your monitoring system
             * if one is configured.
             */
        });
    }

    async query(text, params = []) {
        return this.pool.query(text, params);
    }

    async healthCheck() {
        try {
            await this.pool.query('SELECT 1');

            return {
                connected: true,
                database: 'postgresql'
            };
        } catch {
            return {
                connected: false,
                database: 'postgresql',
                error: 'Database health check failed.'
            };
        }
    }

    async checkMonnifyConfiguration() {
        return checkMonnifyEnvironment();
    }

    async checkAllConfiguration() {
        return checkApplicationEnvironment();
    }

    async withTransaction(callback) {
        if (typeof callback !== 'function') {
            throw new Error(
                'withTransaction requires a callback function.'
            );
        }

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');

            return result;
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                /*
                 * Preserve the original error.
                 */
            }

            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = {
    DatabaseConnection,
    REQUIRED_DATABASE_VARIABLES,
    REQUIRED_MONNIFY_VARIABLES,
    checkEnvironmentVariables,
    checkDatabaseEnvironment,
    checkMonnifyEnvironment,
    checkApplicationEnvironment,
    validateDatabaseUrl
};
