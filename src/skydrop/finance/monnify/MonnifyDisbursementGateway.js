'use strict';

const BASE_URL = (
    process.env.MONNIFY_BASE_URL ||
    'https://api.monnify.com'
).replace(/\/$/, '');

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
    if (process.env.MONNIFY_ENABLED !== 'true') {
        throw new Error('monnify-disabled');
    }

    const key = process.env.MONNIFY_API_KEY;
    const secret = process.env.MONNIFY_SECRET_KEY;

    if (!key || !secret) {
        throw new Error('monnify-credentials-missing');
    }

    if (
        cachedToken &&
        Date.now() < tokenExpiry - 30000
    ) {
        return cachedToken;
    }

    const credentials = Buffer
        .from(`${key}:${secret}`)
        .toString('base64');

    const response = await fetch(
        `${BASE_URL}/api/v1/auth/login`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true ||
        !body.responseBody?.accessToken
    ) {
        throw new Error('monnify-auth-failed');
    }

    cachedToken = body.responseBody.accessToken;

    tokenExpiry = Date.now() +
        Number(body.responseBody.expiresIn || 3600) * 1000;

    return cachedToken;
}

async function post(path, payload) {
    const token = await getToken();

    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true
    ) {
        const error = new Error('monnify-request-failed');

        error.httpStatus = response.status;

        // Do not log credentials or return the raw provider
        // response to the client.
        throw error;
    }

    return body.responseBody || {};
}

async function initiate({
    reference,
    amount,
    accountNumber,
    bankCode,
    accountName,
    narration
}) {
    const contractCode = process.env.MONNIFY_CONTRACT_CODE;
    const sourceAccountNumber =
        process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;

    if (!contractCode) {
        throw new Error('monnify-contract-code-missing');
    }

    if (!sourceAccountNumber) {
        throw new Error('monnify-source-account-missing');
    }

    return post('/api/v2/disbursements/single', {
        amount,
        reference,
        narration: narration || 'SkyDrop disbursement',
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        destinationAccountName: accountName,
        currency: 'NGN',
        sourceAccountNumber,
        contractCode
    });
}

async function status(reference) {
    if (!reference) {
        throw new Error('monnify-reference-required');
    }

    const token = await getToken();

    const response = await fetch(
        `${BASE_URL}/api/v2/disbursements/single/summary?reference=${
            encodeURIComponent(reference)
        }`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true
    ) {
        throw new Error('monnify-status-check-failed');
    }

    return body.responseBody || {};
}

module.exports = {
    initiate,
    status
};
