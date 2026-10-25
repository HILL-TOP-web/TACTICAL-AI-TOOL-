'use strict';

require('dotenv').config();

const WithdrawalConfig = Object.freeze({
    currency: 'NGN',

    // null means no application-level maximum.
    maxWithdrawalNGN: null,

    // Minimum withdrawal amount in NGN.
    minWithdrawalNGN: Number(
        process.env.SKYDROP_MIN_WITHDRAWAL_NGN || 100
    ),

    // Keep withdrawals disabled until the integration is verified.
    enabled: process.env.SKYDROP_WITHDRAWALS_ENABLED === 'true',

    // Keep Monnify disabled until credentials and provider access
    // have been verified.
    monnifyEnabled: process.env.MONNIFY_ENABLED === 'true',

    // Never hard-code API credentials here.
    monnifyBaseUrl: process.env.MONNIFY_BASE_URL || '',

    requestTimeoutMs: Number(
        process.env.MONNIFY_REQUEST_TIMEOUT_MS || 15000
    )
});

function validateWithdrawalConfig() {
    if (
        !Number.isFinite(WithdrawalConfig.minWithdrawalNGN) ||
        WithdrawalConfig.minWithdrawalNGN <= 0
    ) {
        throw new Error(
            'SKYDROP_MIN_WITHDRAWAL_NGN must be a positive number.'
        );
    }

    if (
        WithdrawalConfig.maxWithdrawalNGN !== null &&
        (
            !Number.isFinite(WithdrawalConfig.maxWithdrawalNGN) ||
            WithdrawalConfig.maxWithdrawalNGN <
                WithdrawalConfig.minWithdrawalNGN
        )
    ) {
        throw new Error('Invalid maximum withdrawal configuration.');
    }

    if (
        !Number.isFinite(WithdrawalConfig.requestTimeoutMs) ||
        WithdrawalConfig.requestTimeoutMs <= 0
    ) {
        throw new Error(
            'MONNIFY_REQUEST_TIMEOUT_MS must be a positive number.'
        );
    }

    return true;
}

module.exports = {
    WithdrawalConfig,
    validateWithdrawalConfig
};
