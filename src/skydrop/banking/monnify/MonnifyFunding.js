'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

const {
    getMonnifyAccessToken
} = require('./MonnifyAuth');

async function verifyFunding({
    paymentReference,
    transactionReference
} = {}) {
    if (!paymentReference && !transactionReference) {
        throw new Error(
            'paymentReference or transactionReference is required.'
        );
    }

    const config = getMonnifyConfig();
    const token = await getMonnifyAccessToken();

    const url = new URL(
        `${config.baseUrl}/api/v2/merchant/transactions/query`
    );

    if (paymentReference) {
        url.searchParams.set(
            'paymentReference',
            paymentReference
        );
    }

    if (transactionReference) {
        url.searchParams.set(
            'transactionReference',
            transactionReference
        );
    }

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
            `Monnify funding verification failed (HTTP ${response.status}).`
        );

        error.statusCode = 502;
        throw error;
    }

    const data = body.responseBody;

    return {
        verified: data.paymentStatus === 'PAID',

        paymentStatus:
            data.paymentStatus || 'UNKNOWN',

        paymentReference:
            data.paymentReference || null,

        transactionReference:
            data.transactionReference || null,

        amountPaid: Number(data.amountPaid),

        currency:
            data.currencyCode ||
            data.currency ||
            'NGN',

        providerData: data
    };
}

module.exports = {
    verifyFunding
};
