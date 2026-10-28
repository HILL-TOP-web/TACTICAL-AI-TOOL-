'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

let tokenCache = {
    token: null,
    expiresAt: 0
};

async function getMonnifyAccessToken({
    forceRefresh = false
} = {}) {
    const config = getMonnifyConfig();

    if (!config.enabled) {
        throw new Error('Monnify is disabled.');
    }

    if (!config.apiKey || !config.secretKey) {
        throw new Error(
            'MONNIFY_API_KEY and MONNIFY_SECRET_KEY are required.'
        );
    }

    if (
        !forceRefresh &&
        tokenCache.token &&
        tokenCache.expiresAt > Date.now() + 30000
    ) {
        return tokenCache.token;
    }

    const credentials = Buffer
        .from(`${config.apiKey}:${config.secretKey}`)
        .toString('base64');

    const response = await fetch(
        `${config.baseUrl}/api/v1/auth/login`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(config.timeoutMs)
        }
    );

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true ||
        !body.responseBody?.accessToken
    ) {
        const error = new Error(
            `Monnify authentication failed (HTTP ${response.status}).`
        );

        error.statusCode = 502;
        throw error;
    }

    const expiresIn = Number(
        body.responseBody.expiresIn || 3600
    );

    tokenCache = {
        token: body.responseBody.accessToken,
        expiresAt: Date.now() + expiresIn * 1000
    };

    return tokenCache.token;
}

function clearMonnifyTokenCache() {
    tokenCache = {
        token: null,
        expiresAt: 0
    };
}

module.exports = {
    getMonnifyAccessToken,
    clearMonnifyTokenCache
};
