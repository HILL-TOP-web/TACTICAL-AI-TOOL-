'use strict';

function required(name) {
    const value = process.env[name];

    if (!value || !value.trim()) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value.trim();
}

function getMonnifyConfig() {
    const baseURL = required('MONNIFY_BASE_URL')
        .replace(/\/+$/, '');

    if (baseURL !== 'https://api.monnify.com') {
        throw new Error(
            'Only the Monnify production endpoint is permitted.'
        );
    }

    return Object.freeze({
        enabled: process.env.MONNIFY_ENABLED === 'true',

        baseURL,

        apiKey: required('MONNIFY_API_KEY'),

        secretKey: required('MONNIFY_SECRET_KEY'),

        contractCode: required('MONNIFY_CONTRACT_CODE'),

        webhookSecret: required('MONNIFY_WEBHOOK_SECRET'),

        timeoutMs: 15000
    });
}

module.exports = {
    getMonnifyConfig
};
