'use strict';

require('dotenv').config();

function readPositiveNumber(name, fallback) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(
            `Invalid environment configuration: ${name}`
        );
    }

    return value;
}

const WithdrawalLimits = Object.freeze({
    MIN_WITHDRAWAL_NGN: readPositiveNumber(
        'SKYDROP_MIN_WITHDRAWAL_NGN',
        100
    ),

    MAX_WITHDRAWAL_NGN: readPositiveNumber(
        'SKYDROP_MAX_WITHDRAWAL_NGN',
        100000
    ),

    DAILY_WITHDRAWAL_LIMIT_NGN: readPositiveNumber(
        'SKYDROP_DAILY_WITHDRAWAL_LIMIT_NGN',
        200000
    ),

    MAX_DAILY_WITHDRAWALS: readPositiveNumber(
        'SKYDROP_MAX_DAILY_WITHDRAWALS',
        5
    ),

    MAX_PENDING_WITHDRAWALS: readPositiveNumber(
        'SKYDROP_MAX_PENDING_WITHDRAWALS',
        2
    )
});

if (
    WithdrawalLimits.MIN_WITHDRAWAL_NGN >
    WithdrawalLimits.MAX_WITHDRAWAL_NGN
) {
    throw new Error(
        'Minimum withdrawal cannot exceed maximum withdrawal.'
    );
}

if (
    WithdrawalLimits.MAX_WITHDRAWAL_NGN >
    WithdrawalLimits.DAILY_WITHDRAWAL_LIMIT_NGN
) {
    throw new Error(
        'Maximum withdrawal cannot exceed the daily withdrawal limit.'
    );
}

class WithdrawalLimitsManager {
    static getLimits() {
        return { ...WithdrawalLimits };
    }

    static validateAmount(amount) {
        if (
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error('Withdrawal amount must be a positive number.');
        }

        if (
            amount < WithdrawalLimits.MIN_WITHDRAWAL_NGN
        ) {
            throw new Error('Withdrawal amount is below the minimum.');
        }

        if (
            amount > WithdrawalLimits.MAX_WITHDRAWAL_NGN
        ) {
            throw new Error('Withdrawal amount exceeds the maximum.');
        }

        return true;
    }
}

module.exports = WithdrawalLimits;

module.exports.WithdrawalLimitsManager = WithdrawalLimitsManager;
