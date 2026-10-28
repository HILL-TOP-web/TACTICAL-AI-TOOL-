'use strict';

function getMonnifyConfig(env = process.env) {
    const config = {
        enabled:
            String(env.MONNIFY_ENABLED || 'false').toLowerCase() === 'true',

        baseUrl:
            env.MONNIFY_BASE_URL || 'https://api.monnify.com',

        apiKey: env.MONNIFY_API_KEY,
        secretKey: env.MONNIFY_SECRET_KEY,
        contractCode: env.MONNIFY_CONTRACT_CODE,

        sourceAccountNumber:
            env.MONNIFY_WALLET_ACCOUNT_NUMBER,

        timeoutMs: Number(
            env.MONNIFY_REQUEST_TIMEOUT_MS || 15000
        ),

        disbursementPath:
            env.MONNIFY_DISBURSEMENT_PATH ||
            '/api/v2/disbursements/single',

        statusPath:
            env.MONNIFY_DISBURSEMENT_STATUS_PATH ||
            '/api/v2/disbursements/single/summary'
    };

    if (config.baseUrl !== 'https://api.monnify.com') {
        throw new Error(
            'MONNIFY_BASE_URL must be https://api.monnify.com.'
        );
    }

    if (
        !Number.isFinite(config.timeoutMs) ||
        config.timeoutMs < 1000 ||
        config.timeoutMs > 60000
    ) {
        throw new Error(
            'MONNIFY_REQUEST_TIMEOUT_MS must be between 1000 and 60000.'
        );
    }

    if (
        !config.disbursementPath.startsWith('/') ||
        !config.statusPath.startsWith('/')
    ) {
        throw new Error(
            'Monnify API paths must start with /.'
        );
    }

    return Object.freeze(config);
}

function validateMonnifyEnvironment(
    env = process.env,
    { requireDisbursement = false } = {}
) {
    const config = getMonnifyConfig(env);
    const missing = [];

    if (!config.apiKey) {
        missing.push('MONNIFY_API_KEY');
    }

    if (!config.secretKey) {
        missing.push('MONNIFY_SECRET_KEY');
    }

    if (!config.contractCode) {
        missing.push('MONNIFY_CONTRACT_CODE');
    }

    if (
        requireDisbursement &&
        !config.sourceAccountNumber
    ) {
        missing.push('MONNIFY_WALLET_ACCOUNT_NUMBER');
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing Monnify configuration: ${missing.join(', ')}`
        );
    }

    return {
        enabled: config.enabled,
        configured: true
    };
}

module.exports = {
    getMonnifyConfig,
    validateMonnifyEnvironment
};
