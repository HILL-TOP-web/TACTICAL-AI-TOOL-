'use strict';

const {
    WithdrawalConfig,
    validateWithdrawalConfig
} = require('./WithdrawalConfig');

class WithdrawalLimits {
    static validateAmount(amount) {
        validateWithdrawalConfig();

        if (
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error(
                'Withdrawal amount must be a positive number.'
            );
        }

        if (amount < WithdrawalConfig.minWithdrawalNGN) {
            throw new Error(
                `Minimum withdrawal is ₦${WithdrawalConfig.minWithdrawalNGN}.`
            );
        }

        // null means unlimited at the application level.
        if (
            WithdrawalConfig.maxWithdrawalNGN !== null &&
            amount > WithdrawalConfig.maxWithdrawalNGN
        ) {
            throw new Error(
                `Maximum withdrawal is ₦${WithdrawalConfig.maxWithdrawalNGN}.`
            );
        }

        return true;
    }

    static getLimits() {
        return {
            currency: WithdrawalConfig.currency,
            minimum: WithdrawalConfig.minWithdrawalNGN,
            maximum: WithdrawalConfig.maxWithdrawalNGN,
            unlimitedMaximum:
                WithdrawalConfig.maxWithdrawalNGN === null
        };
    }
}

module.exports = WithdrawalLimits;
