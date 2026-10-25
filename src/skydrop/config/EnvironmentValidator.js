'use strict';

require('dotenv').config();

const EnvironmentValidator = {
    isProduction() {
        return process.env.NODE_ENV === 'production';
    },

    isRender() {
        return Boolean(
            process.env.RENDER ||
            process.env.RENDER_SERVICE_ID ||
            process.env.RENDER_INSTANCE_ID
        );
    },

    validate() {
        const errors = [];
        const warnings = [];

        const required = [
            'NODE_ENV',
            'PORT',
            'APP_NAME'
        ];

        for (const name of required) {
            if (!process.env[name]?.trim()) {
                errors.push(`Missing required variable: ${name}`);
            }
        }

        const port = Number(process.env.PORT);

        if (
            process.env.PORT &&
            (!Number.isInteger(port) || port < 1 || port > 65535)
        ) {
            errors.push('PORT must be a valid TCP port.');
        }

        const booleanVariables = [
            'DATABASE_SSL',
            'MONNIFY_ENABLED',
            'MONNIFY_CONNECTIVITY_CHECK_ENABLED',
            'SKYDROP_WITHDRAWALS_ENABLED',
            'SKYDROP_TRANSFERS_ENABLED',
            'SKYDROP_EXCHANGE_ENABLED',
            'SKYDROP_TRADING_ENABLED',
            'SKYDROP_MINING_ENABLED',
            'SKYDROP_DAILY_REWARD_ENABLED',
            'SKYDROP_CONVERSION_ENABLED',
            'PAYMENT_WEBHOOK_VERIFICATION_REQUIRED',
            'PAYMENT_RECONCILIATION_ENABLED',
            'REJECT_DUPLICATE_TRANSACTIONS',
            'REQUIRE_IDEMPOTENCY_KEY',
            'ENV_VALIDATION_ENABLED',
            'RENDER_ENV_CHECK_ENABLED'
        ];

        for (const name of booleanVariables) {
            const value = process.env[name];

            if (
                value !== undefined &&
                !['true', 'false'].includes(value.toLowerCase())
            ) {
                errors.push(
                    `${name} must be true or false.`
                );
            }
        }

        const numericVariables = [
            'MONNIFY_TIMEOUT_MS',
            'SESSION_TTL_SECONDS',
            'SKYDROP_MIN_WITHDRAWAL_NGN',
            'SKYDROP_MAX_WITHDRAWAL_NGN',
            'SKYDROP_DAILY_WITHDRAWAL_LIMIT_NGN',
            'SKYDROP_MAX_DAILY_WITHDRAWALS',
            'SKYDROP_MAX_PENDING_WITHDRAWALS',
            'SKYDROP_MIN_TRANSFER_NGN',
            'SKYDROP_MAX_TRANSFER_NGN',
            'SKYDROP_MINING_INTERVAL_SECONDS',
            'SKD_UNITS_PER_TOKEN',
            'SKD_REFERENCE_AMOUNT',
            'SKD_REFERENCE_USD',
            'USD_TO_NGN_REFERENCE_RATE'
        ];

        for (const name of numericVariables) {
            const value = process.env[name];

            if (value === undefined || value === '') {
                continue;
            }

            if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
                errors.push(
                    `${name} must be a positive number.`
                );
            }
        }

        const minWithdrawal = Number(
            process.env.SKYDROP_MIN_WITHDRAWAL_NGN
        );

        const maxWithdrawal = Number(
            process.env.SKYDROP_MAX_WITHDRAWAL_NGN
        );

        if (
            Number.isFinite(minWithdrawal) &&
            Number.isFinite(maxWithdrawal) &&
            minWithdrawal > maxWithdrawal
        ) {
            errors.push(
                'Minimum withdrawal cannot exceed maximum withdrawal.'
            );
        }

        if (this.isProduction()) {
            const secrets = [
                'SESSION_SECRET',
                'JWT_SECRET',
                'ENCRYPTION_KEY'
            ];

            for (const name of secrets) {
                if (!process.env[name]?.trim()) {
                    errors.push(
                        `Production configuration is missing ${name}.`
                    );
                }
            }

            if (process.env.SESSION_COOKIE_SECURE !== 'true') {
                errors.push(
                    'SESSION_COOKIE_SECURE must be true in production.'
                );
            }

            if (
                process.env.MONNIFY_ENABLED === 'true' ||
                process.env.SKYDROP_WITHDRAWALS_ENABLED === 'true'
            ) {
                const monnifyVariables = [
                    'MONNIFY_BASE_URL',
                    'MONNIFY_API_KEY',
                    'MONNIFY_SECRET_KEY',
                    'MONNIFY_CONTRACT_CODE'
                ];

                for (const name of monnifyVariables) {
                    if (!process.env[name]?.trim()) {
                        errors.push(
                            `Financial integration requires ${name}.`
                        );
                    }
                }
            }
        }

        if (this.isRender()) {
            if (
                process.env.RENDER_ENV_CHECK_ENABLED === 'true'
            ) {
                warnings.push(
                    'Render environment detected; deployment configuration checks enabled.'
                );
            }

            if (
                process.env.NODE_ENV !== 'production'
            ) {
                warnings.push(
                    'Render is running without NODE_ENV=production.'
                );
            }
        }

        return {
            valid: errors.length === 0,
            environment: this.isProduction()
                ? 'production'
                : 'development',
            platform: this.isRender() ? 'render' : 'other',
            errors,
            warnings
        };
    },

    assertValid() {
        const result = this.validate();

        for (const warning of result.warnings) {
            console.warn(`[Environment] ${warning}`);
        }

        if (!result.valid) {
            const message = result.errors.join('\n');

            throw new Error(
                `Environment validation failed:\n${message}`
            );
        }

        console.log(
            `[Environment] Configuration valid. Platform: ${result.platform}.`
        );

        return result;
    }
};

module.exports = EnvironmentValidator;
