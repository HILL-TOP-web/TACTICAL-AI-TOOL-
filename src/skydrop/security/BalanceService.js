'use strict';

const {
    validateCurrency
} = require('../security/TransactionValidator');

class BalanceServiceError extends Error {
    constructor(message, code = 'BALANCE_SERVICE_ERROR') {
        super(message);

        this.name = 'BalanceServiceError';
        this.code = code;
        this.statusCode = 500;
    }
}

class BalanceService {
    constructor({ walletService }) {
        if (
            !walletService ||
            typeof walletService.getAvailableBalance !== 'function'
        ) {
            throw new TypeError(
                'BalanceService requires the existing WalletService.'
            );
        }

        this.walletService = walletService;
    }

    async getAvailableBalance({
        userId,
        currency,
        session = null
    }) {
        if (!userId) {
            const error = new BalanceServiceError(
                'A wallet owner is required.',
                'BALANCE_USER_REQUIRED'
            );

            error.statusCode = 400;

            throw error;
        }

        const normalizedCurrency = validateCurrency(currency);

        const balance = await this.walletService.getAvailableBalance({
            userId: String(userId),
            currency: normalizedCurrency,
            session
        });

        if (balance === null || balance === undefined) {
            const error = new BalanceServiceError(
                'The available balance could not be retrieved.',
                'BALANCE_NOT_AVAILABLE'
            );

            error.statusCode = 503;

            throw error;
        }

        return balance;
    }

    async assertSufficientBalance({
        userId,
        currency,
        amount,
        session = null
    }) {
        const {
            BalanceValidator
        } = require('../security/BalanceValidator');

        const validator = new BalanceValidator({
            walletService: this.walletService
        });

        return validator.assertSufficientBalance({
            userId,
            currency,
            amount,
            session
        });
    }

    async getBalances({
        userId,
        currencies,
        session = null
    }) {
        if (!Array.isArray(currencies) || currencies.length === 0) {
            throw new TypeError(
                'Provide at least one currency.'
            );
        }

        const normalizedCurrencies = [
            ...new Set(currencies.map(validateCurrency))
        ];

        const balances = {};

        for (const currency of normalizedCurrencies) {
            balances[currency] = await this.getAvailableBalance({
                userId,
                currency,
                session
            });
        }

        return {
            userId: String(userId),
            balances
        };
    }
}

module.exports = {
    BalanceService,
    BalanceServiceError
};
