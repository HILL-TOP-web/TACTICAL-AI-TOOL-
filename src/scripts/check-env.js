'use strict';

require('dotenv').config();

const REQUIRED_VARIABLES = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN',
    'SKYDROP_FINANCIAL_API_ENABLED',
    'SKYDROP_WITHDRAWALS_ENABLED',
    'SKYDROP_MONNIFY_WITHDRAWALS_ENABLED',
    'SKYDROP_MIN_WITHDRAWAL_NGN',
    'MONNIFY_ENABLED',
    'MONNIFY_BASE_URL',
    'MONNIFY_API_KEY',
    'MONNIFY_SECRET_KEY',
    'MONNIFY_CONTRACT_CODE',
    'MONNIFY_WEBHOOK_SECRET',
    'SKYDROP_EXCHANGE_ENABLED',
    'SKYDROP_EXCHANGE_ALLOWED_ASSETS',
    'SKYDROP_TRADING_ENABLED',
    'SKD_USD_RATE',
    'USD_NGN_RATE',
    'SKYDROP_MINING_ENABLED',
    'SKYDROP_MINING_INITIAL_REWARD',
    'SKYDROP_MINING_INTERVAL_MS'
];

function validateEnvironment() {
    const missing = [];

    for (const variable of REQUIRED_VARIABLES) {
        const value = process.env[variable];

        if (
            typeof value !== 'string' ||
            value.trim() === ''
        ) {
            missing.push(variable);
        }
    }

    const uri = process.env.MONGODB_URI;

    if (
        uri &&
        !/^mongodb(?:\+srv)?:\/\//i.test(uri)
    ) {
        throw new Error(
            'MONGODB_URI must be a valid MongoDB connection URI.'
        );
    }

    if (
        process.env.MONNIFY_BASE_URL &&
        process.env.MONNIFY_BASE_URL.replace(/\/+$/, '') !==
            'https://api.monnify.com'
    ) {
        throw new Error(
            'MONNIFY_BASE_URL must use the configured production endpoint.'
        );
    }

    if (
        process.env.JWT_SECRET &&
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error(
            'JWT_SECRET must contain at least 32 characters.'
        );
    }

    const minimumWithdrawal = Number(
        process.env.SKYDROP_MIN_WITHDRAWAL_NGN
    );

    if (
        process.env.SKYDROP_MIN_WITHDRAWAL_NGN &&
        (!Number.isFinite(minimumWithdrawal) ||
            minimumWithdrawal < 1)
    ) {
        throw new Error(
            'SKYDROP_MIN_WITHDRAWAL_NGN must be a positive number.'
        );
    }

    const usdRate = Number(process.env.SKD_USD_RATE);
    const ngnRate = Number(process.env.USD_NGN_RATE);

    if (
        process.env.SKD_USD_RATE &&
        (!Number.isFinite(usdRate) || usdRate <= 0)
    ) {
        throw new Error('SKD_USD_RATE must be positive.');
    }

    if (
        process.env.USD_NGN_RATE &&
        (!Number.isFinite(ngnRate) || ngnRate <= 0)
    ) {
        throw new Error('USD_NGN_RATE must be positive.');
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }

    return {
        valid: true,
        checked: REQUIRED_VARIABLES.length
    };
}

if (require.main === module) {
    try {
        const result = validateEnvironment();

        console.log(
            `Environment validation passed. ${result.checked} variables checked.`
        );
    } catch (error) {
        console.error(
            `Environment validation failed: ${error.message}`
        );

        process.exitCode = 1;
    }
}

module.exports = {
    validateEnvironment
};
