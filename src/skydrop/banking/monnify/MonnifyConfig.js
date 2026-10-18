'use strict';

function requiredEnv(name) {
    const value = process.env[name];

    if (!value || !value.trim()) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value.trim();
}

function getMonnifyConfig() {
    const baseUrl = (
        process.env.MONNIFY_BASE_URL ||
        'https://api.monnify.com'
    ).replace(/\/+$/, '');

    return Object.freeze({
        baseUrl,

        apiKey: requiredEnv('MONNIFY_API_KEY'),

        secretKey: requiredEnv('MONNIFY_SECRET_KEY'),

        contractCode: requiredEnv('MONNIFY_CONTRACT_CODE'),

        timeoutMs: 15000,

        /*
         * Configure these from the current Monnify Disbursement
         * API documentation and your account's approved API access.
         */
        disbursementPath:
            process.env.MONNIFY_DISBURSEMENT_PATH ||
            '/api/v2/disbursements/single',

        statusPath:
            process.env.MONNIFY_DISBURSEMENT_STATUS_PATH ||
            '/api/v2/disbursements/single/summary',

        currency: 'NGN'
    });
}

module.exports = {
    getMonnifyConfig
};
