'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

const {
    getMonnifyAccessToken
} = require('./MonnifyAuth');

async function submitDisbursement({
    amount,
    reference,
    destinationAccountNumber,
    destinationBankCode,
    destinationAccountName,
    narration = 'SkyDrop withdrawal',
    async: asynchronous = true
} = {}) {
    const config = getMonnifyConfig();

    if (!config.enabled) {
        throw new Error('Monnify is disabled.');
    }

    if (!config.sourceAccountNumber) {
        throw new Error(
            'MONNIFY_WALLET_ACCOUNT_NUMBER is required.'
        );
    }

    const numericAmount = Number(amount);

    if (
        !Number.isSafeInteger(numericAmount) ||
        numericAmount <= 0
    ) {
        throw new Error(
            'amount must be a positive whole NGN amount.'
        );
    }

    if (
        !reference ||
        String(reference).trim().length > 100
    ) {
        throw new Error(
            'A unique disbursement reference is required.'
        );
    }

    if (
        !/^\d{10}$/.test(
            String(destinationAccountNumber || '')
        )
    ) {
        throw new Error(
            'Destination account must contain exactly 10 digits.'
        );
    }

    if (
        !destinationBankCode ||
        !destinationAccountName
    ) {
        throw new Error(
            'Destination bank code and verified account name are required.'
        );
    }

    const token = await getMonnifyAccessToken();

    const payload = {
        amount: numericAmount,
        reference: String(reference).trim(),

        narration: String(narration).slice(0, 100),

        destinationBankCode:
            String(destinationBankCode),

        destinationAccountNumber:
            String(destinationAccountNumber),

        destinationAccountName:
            String(destinationAccountName),

        currency: 'NGN',

        sourceAccountNumber:
            config.sourceAccountNumber,

        async: Boolean(asynchronous)
    };

    const response = await fetch(
        `${config.baseUrl}${config.disbursementPath}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(config.timeoutMs)
        }
    );

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true ||
        !body.responseBody
    ) {
        const error = new Error(
            `Monnify disbursement failed (HTTP ${response.status}).`
        );

        error.statusCode =
            response.status >= 500 ? 502 : 400;

        error.providerCode =
            body.responseCode || null;

        throw error;
    }

    const data = body.responseBody;

    return {
        accepted: true,

        reference:
            data.reference || payload.reference,

        status:
            String(data.status || 'PENDING').toUpperCase(),

        transactionReference:
            data.transactionReference || null,

        responseCode:
            body.responseCode || null,

        responseMessage:
            body.responseMessage || null
    };
}

async function getDisbursementStatus(reference) {
    if (!reference) {
        throw new Error('reference is required.');
    }

    const config = getMonnifyConfig();
    const token = await getMonnifyAccessToken();

    const url = new URL(
        `${config.baseUrl}${config.statusPath}`
    );

    url.searchParams.set(
        'reference',
        String(reference)
    );

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout(config.timeoutMs)
    });

    const body = await response.json().catch(() => ({}));

    if (
        !response.ok ||
        body.requestSuccessful !== true ||
        !body.responseBody
    ) {
        const error = new Error(
            `Monnify disbursement status query failed (HTTP ${response.status}).`
        );

        error.statusCode = 502;
        throw error;
    }

    return body.responseBody;
}

module.exports = {
    submitDisbursement,
    getDisbursementStatus
};
