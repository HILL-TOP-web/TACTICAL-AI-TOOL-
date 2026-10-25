'use strict';

require('dotenv').config();

class EnvironmentValidator {
    static parseBoolean(name, defaultValue = false) {
        const value = process.env[name];

        if (value === undefined || value === '') {
            return defaultValue;
        }

        if (value === 'true') {
            return true;
        }

        if (value === 'false') {
            return false;
        }

        throw new Error(
            `${name} must be either true or false.`
        );
    }

    static parseNumber(
        name,
        defaultValue,
        { min = 0, max = Number.MAX_SAFE_INTEGER } = {}
    ) {
        const rawValue = process.env[name];

        if (rawValue === undefined || rawValue === '') {
            return defaultValue;
        }

        const value = Number(rawValue);

        if (
            !Number.isFinite(value) ||
            value < min ||
            value > max
        ) {
            throw new Error(
                `${name} must be a number between ${min} and ${max}.`
            );
        }

        return value;
    }

    static validateRequiredVariables() {
        const required = [
            'NODE_ENV',
            'PORT',
            'APP_NAME'
        ];

        const missing = required.filter(name => {
            const value = process.env[name];

            return (
                typeof value !== 'string' ||
                value.trim() === ''
            );
        });

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}`
            );
        }

        const validEnvironments = [
            'development',
            'test',
            'production'
        ];

        if (!validEnvironments.includes(process.env.NODE_ENV)) {
            throw new Error(
                'NODE_ENV must be development, test, or production.'
            );
        }

        this.parseNumber('PORT', 3000, {
            min: 1,
            max: 65535
        });
    }

    static validateWithdrawalConfiguration() {
        const withdrawalsEnabled = this.parseBoolean(
            'SKYDROP_WITHDRAWALS_ENABLED'
        );

        const monnifyEnabled = this.parseBoolean(
            'MONNIFY_ENABLED'
        );

        const bankWithdrawalsEnabled = this.parseBoolean(
            'SKYDROP_BANK_WITHDRAWALS_ENABLED'
        );

        const minimumWithdrawal = this.parseNumber(
            'SKYDROP_MIN_WITHDRAWAL_NGN',
            100,
            {
                min: 0.01,
                max: Number.MAX_SAFE_INTEGER
            }
        );

        this.parseNumber('MONNIFY_REQUEST_TIMEOUT_MS', 15000, {
            min: 1000,
            max: 120000
        });

        /*
         * The application-level maximum is unlimited.
         *
         * Detect the legacy setting so an obsolete cap does not
         * silently remain in the environment.
         */
        if (
            Object.prototype.hasOwnProperty.call(
                process.env,
                'SKYDROP_MAX_WITHDRAWAL_NGN'
            )
        ) {
            throw new Error(
                'Remove SKYDROP_MAX_WITHDRAWAL_NGN from .env. ' +
                'The application-level withdrawal maximum is unlimited.'
            );
        }

        if (
            withdrawalsEnabled &&
            !monnifyEnabled &&
            !bankWithdrawalsEnabled
        ) {
            throw new Error(
                'Withdrawals are enabled, but no withdrawal method is enabled.'
            );
        }

        if (monnifyEnabled) {
            const requiredMonnifyVariables = [
                'MONNIFY_BASE_URL',
                'MONNIFY_API_KEY',
                'MONNIFY_SECRET_KEY',
                'MONNIFY_CONTRACT_CODE'
            ];

            const missing = requiredMonnifyVariables.filter(name => {
                const value = process.env[name];

                return (
                    typeof value !== 'string' ||
                    value.trim() === ''
                );
            });

            if (missing.length > 0) {
                throw new Error(
                    `Missing Monnify configuration: ${missing.join(', ')}`
                );
            }

            let parsedUrl;

            try {
                parsedUrl = new URL(
                    process.env.MONNIFY_BASE_URL
                );
            } catch {
                throw new Error(
                    'MONNIFY_BASE_URL must be a valid URL.'
                );
            }

            if (
                parsedUrl.protocol !== 'https:' &&
                !(
                    parsedUrl.protocol === 'http:' &&
                    parsedUrl.hostname === 'localhost'
                )
            ) {
                throw new Error(
                    'MONNIFY_BASE_URL must use HTTPS outside localhost.'
                );
            }

            const endpoint =
                process.env.MONNIFY_DISBURSEMENT_PATH;

            if (
                typeof endpoint !== 'string' ||
                !endpoint.startsWith('/api/') ||
                endpoint.startsWith('//') ||
                endpoint.includes('://') ||
                endpoint.includes('\\')
            ) {
                throw new Error(
                    'MONNIFY_DISBURSEMENT_PATH must contain the verified relative API path.'
                );
            }
        }

        return {
            withdrawalsEnabled,
            monnifyEnabled,
            bankWithdrawalsEnabled,
            minimumWithdrawalNGN: minimumWithdrawal,

            // null explicitly means unlimited at the application level.
            maximumWithdrawalNGN: null
        };
    }

    static validateProductionConfiguration() {
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }

        /*
         * If the application uses a session secret, require it
         * in production. Add other project-specific secrets here
         * when the corresponding modules are implemented.
         */
        const sessionSecret = process.env.SESSION_SECRET;

        if (
            typeof sessionSecret !== 'string' ||
            sessionSecret.trim().length < 32
        ) {
            throw new Error(
                'Production requires SESSION_SECRET with at least 32 characters.'
            );
        }

        if (sessionSecret === 'change-me' || sessionSecret === 'secret') {
            throw new Error(
                'Replace the example SESSION_SECRET with a strong random secret.'
            );
        }

        return true;
    }

    static validate() {
        this.validateRequiredVariables();

        const withdrawalConfiguration =
            this.validateWithdrawalConfiguration();

        this.validateProductionConfiguration();

        return {
            valid: true,
            environment: process.env.NODE_ENV,
            appName: process.env.APP_NAME,
            withdrawalConfiguration
        };
    }
}

module.exports = EnvironmentValidator;
