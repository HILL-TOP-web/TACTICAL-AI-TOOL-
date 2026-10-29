'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

const {
    getMonnifyAccessToken,
    invalidateMonnifyAccessToken
} = require('./MonnifyAuth');

async function request(path, options = {}) {
    const config = getMonnifyConfig();

    if (!config.enabled) {
        throw new Error('Monnify is disabled.');
    }

    const token = await getMonnifyAccessToken();

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        config.timeoutMs
    );

    try {
        const response = await fetch(
            `${config.baseURL}${path}`,
            {
                ...options,

                signal: controller.signal,

                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            }
        );

        const body = await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            invalidateMonnifyAccessToken();
        }

        if (!response.ok) {
            throw new Error(
                `Monnify request failed with HTTP ${response.status}.`
            );
        }

        if (body.requestSuccessful !== true) {
            throw new Error(
                'Monnify did not accept the request.'
            );
        }

        return body.responseBody;
    } finally {
        clearTimeout(timeout);
    }
}

async function submitDisbursement({
    amount,
    reference,
    narration,
    destinationBankCode,
    destinationAccountNumber,
    destinationAccountName
}) {
    const config = getMonnifyConfig();

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid disbursement amount.');
    }

    if (!reference || !narration) {
        throw new Error(
            'A reference and narration are required.'
        );
    }

    if (
        !/^\d{10}$/.test(destinationAccountNumber || '')
    ) {
        throw new Error(
            'The destination account number must contain 10 digits.'
        );
    }

    if (!destinationBankCode || !destinationAccountName) {
        throw new Error(
            'Verified bank details are required.'
        );
    }

    return request(
        '/api/v2/disbursements/single',
        {
            method: 'POST',

            body: JSON.stringify({
                amount,
                reference,
                narration,

                destinationBankCode,
                destinationAccountNumber,
                destinationAccountName,

                currency: 'NGN',

                sourceAccountNumber:
                    process.env.MONNIFY_SOURCE_ACCOUNT_NUMBER
            })
        }
    );
}

async function getDisbursementStatus(reference) {
    if (!reference) {
        throw new Error(
            'A disbursement reference is required.'
        );
    }

    return request(
        `/api/v2/disbursements/single/transactions/${encodeURIComponent(reference)}`,
        {
            method: 'GET'
        }
    );
}

module.exports = {
    submitDisbursement,
    getDisbursementStatus
};
