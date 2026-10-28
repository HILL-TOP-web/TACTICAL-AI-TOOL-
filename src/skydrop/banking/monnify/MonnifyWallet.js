'use strict';

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

const {
    getMonnifyAccessToken
} = require('./MonnifyAuth');

async function getDisbursementWalletBalance(accountNumber) {
    const config = getMonnifyConfig();

    const account = String(
        accountNumber ||
        config.sourceAccountNumber ||
        ''
    ).trim();

    if (!account) {
        throw new Error(
            'MONNIFY_WALLET_ACCOUNT_NUMBER is required.'
        );
    }

    const token = await getMonnifyAccessToken();

    const url = new URL(
        `${config.baseUrl}/api/v2/disbursements/wallet-balance`
    );

    url.searchParams.set('accountNumber', account);

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
            `Monnify wallet balance query failed (HTTP ${response.status}).`
        );

        error.statusCode = 502;
        throw error;
    }

    return body.responseBody;
}

module.exports = {
    getDisbursementWalletBalance
};
