'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

let cachedToken = null;
let tokenExpiresAt = 0;
let pendingAuthentication = null;

async function getMonnifyAccessToken() {
    if (
        cachedToken &&
        Date.now() < tokenExpiresAt
    ) {
        return cachedToken;
    }

    if (pendingAuthentication) {
        return pendingAuthentication;
    }

    pendingAuthentication = authenticate();

    try {
        return await pendingAuthentication;
    } finally {
        pendingAuthentication = null;
    }
}

async function authenticate() {
    const config = getMonnifyConfig();

    if (!config.enabled) {
        throw new Error('Monnify is disabled.');
    }

    const credentials = Buffer.from(
        `${config.apiKey}:${config.secretKey}`
    ).toString('base64');

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        config.timeoutMs
    );

    try {
        const response = await fetch(
            `${config.baseURL}/api/v1/auth/login`,
            {
                method: 'POST',

                headers: {
                    Authorization: `Basic ${credentials}`,
                    Accept: 'application/json'
                },

                signal: controller.signal
            }
        );

        const data = await response.json();

        if (
            !response.ok ||
            data.requestSuccessful !== true ||
            !data.responseBody?.accessToken
        ) {
            throw new Error(
                'Monnify authentication was unsuccessful.'
            );
        }

        cachedToken = data.responseBody.accessToken;

        const expiresIn = Number(
            data.responseBody.expiresIn || 3600
        );

        tokenExpiresAt =
            Date.now() +
            Math.max(expiresIn - 60, 30) * 1000;

        return cachedToken;
    } finally {
        clearTimeout(timeout);
    }
}

function invalidateMonnifyAccessToken() {
    cachedToken = null;
    tokenExpiresAt = 0;
}

module.exports = {
    getMonnifyAccessToken,
    invalidateMonnifyAccessToken
};
