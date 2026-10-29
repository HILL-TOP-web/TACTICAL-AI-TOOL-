'use strict';

require('dotenv').config();

const DEFAULT_BASE_URL = 'https://api.monnify.com';

function getMonnifyConfig() {
    const baseUrl = (
        process.env.MONNIFY_BASE_URL ||
        DEFAULT_BASE_URL
    ).replace(/\/+$/, '');

    return {
        enabled: process.env.MONNIFY_ENABLED === 'true',
        baseUrl,
        apiKey: process.env.MONNIFY_API_KEY,
        secretKey: process.env.MONNIFY_SECRET_KEY,
        contractCode: process.env.MONNIFY_CONTRACT_CODE
    };
}

function validateMonnifyConfig(config) {
    const errors = [];

    if (!config.enabled) {
        errors.push(
            'MONNIFY_ENABLED must be set to true.'
        );
    }

    if (
        !config.apiKey ||
        !config.apiKey.trim()
    ) {
        errors.push('MONNIFY_API_KEY is missing.');
    }

    if (
        !config.secretKey ||
        !config.secretKey.trim()
    ) {
        errors.push('MONNIFY_SECRET_KEY is missing.');
    }

    if (
        !config.contractCode ||
        !config.contractCode.trim()
    ) {
        errors.push(
            'MONNIFY_CONTRACT_CODE is missing.'
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(config.baseUrl);
    } catch {
        errors.push('MONNIFY_BASE_URL is invalid.');
    }

    if (parsedUrl) {
        if (parsedUrl.protocol !== 'https:') {
            errors.push(
                'MONNIFY_BASE_URL must use HTTPS.'
            );
        }

        if (
            parsedUrl.username ||
            parsedUrl.password
        ) {
            errors.push(
                'MONNIFY_BASE_URL must not contain embedded credentials.'
            );
        }
    }

    return errors;
}

async function checkMonnifyAuthentication(config) {
    const errors = validateMonnifyConfig(config);

    if (errors.length > 0) {
        for (const error of errors) {
            console.error(error);
        }

        return false;
    }

    if (typeof fetch !== 'function') {
        console.error(
            'A Node.js runtime with built-in fetch is required.'
        );

        return false;
    }

    const credentials = Buffer.from(
        `${config.apiKey}:${config.secretKey}`
    ).toString('base64');

    let response;

    try {
        response = await fetch(
            `${config.baseUrl}/api/v1/auth/login`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`,
                    Accept: 'application/json'
                },
                signal: AbortSignal.timeout(15000)
            }
        );
    } catch {
        console.error(
            'Unable to reach Monnify authentication endpoint.'
        );

        return false;
    }

    let data;

    try {
        data = await response.json();
    } catch {
        console.error(
            'Monnify returned an unreadable authentication response.'
        );

        return false;
    }

    if (
        !response.ok ||
        data.requestSuccessful !== true ||
        !data.responseBody ||
        typeof data.responseBody.accessToken !== 'string'
    ) {
        console.error(
            `Monnify authentication failed (HTTP ${response.status}).`
        );

        return false;
    }

    console.log(
        'Monnify authentication check passed.'
    );

    return true;
}

async function main() {
    const config = getMonnifyConfig();
    const errors = validateMonnifyConfig(config);

    if (errors.length > 0) {
        for (const error of errors) {
            console.error(error);
        }

        process.exitCode = 1;
        return;
    }

    console.log(
        'Monnify configuration validation passed.'
    );

    if (
        process.env.MONNIFY_CONNECTIVITY_CHECK !== 'true'
    ) {
        console.log(
            'Connectivity check skipped. Set ' +
            'MONNIFY_CONNECTIVITY_CHECK=true to request authentication.'
        );

        return;
    }

    const authenticated =
        await checkMonnifyAuthentication(config);

    if (!authenticated) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().catch(() => {
        console.error(
            'Monnify configuration check failed.'
        );

        process.exitCode = 1;
    });
}

module.exports = {
    getMonnifyConfig,
    validateMonnifyConfig,
    checkMonnifyAuthentication
};
