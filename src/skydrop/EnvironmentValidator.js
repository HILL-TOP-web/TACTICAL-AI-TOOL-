'use strict';

require('dotenv').config();

class EnvironmentValidator {

    constructor() {

        this.required = [
            'NODE_ENV',
            'PORT',
            'MONGODB_URI',
            'JWT_SECRET'
        ];

        this.monnifyRequired = [
            'MONNIFY_BASE_URL',
            'MONNIFY_API_KEY',
            'MONNIFY_SECRET_KEY',
            'MONNIFY_CONTRACT_CODE'
        ];
    }

    validateRequired(names) {

        const missing = names.filter(name => {

            const value = process.env[name];

            return (
                typeof value !== 'string' ||
                value.trim().length === 0
            );
        });

        if (missing.length) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}`
            );
        }
    }

    validate() {

        this.validateRequired(this.required);

        if (!Number.isInteger(Number(process.env.PORT)) ||
            Number(process.env.PORT) <= 0) {
            throw new Error('Invalid PORT configuration.');
        }

        if (process.env.JWT_SECRET.length < 32) {
            throw new Error(
                'JWT_SECRET must contain at least 32 characters.'
            );
        }

        if (
            process.env.MONNIFY_ENABLED === 'true' ||
            process.env.SKYDROP_MONNIFY_WITHDRAWALS_ENABLED === 'true'
        ) {
            this.validateRequired(this.monnifyRequired);

            if (process.env.MONNIFY_BASE_URL !==
                'https://api.monnify.com') {
                throw new Error(
                    'Monnify must use its production base URL.'
                );
            }
        }

        return true;
    }
}

module.exports = new EnvironmentValidator();
