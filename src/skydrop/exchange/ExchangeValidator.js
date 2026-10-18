'use strict';

const ExchangeConfig = require('./ExchangeConfig');

class ExchangeValidator {
    static validate(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('Invalid exchange request.');
        }

        const {
            userId,
            fromCurrency,
            toCurrency,
            amount
        } = request;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            !ExchangeConfig.supportedCurrencies.includes(
                fromCurrency
            )
        ) {
            throw new Error('Unsupported source currency.');
        }

        if (
            !ExchangeConfig.supportedCurrencies.includes(
                toCurrency
            )
        ) {
            throw new Error('Unsupported destination currency.');
        }

        if (fromCurrency === toCurrency) {
            throw new Error(
                'Source and destination currencies must differ.'
            );
        }

        if (
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error('A valid positive amount is required.');
        }

        if (
            amount < ExchangeConfig.minimumExchangeAmount
        ) {
            throw new Error('Amount is below the exchange minimum.');
        }

        if (
            amount > ExchangeConfig.maximumExchangeAmount
        ) {
            throw new Error('Amount exceeds the exchange maximum.');
        }

        return {
            userId: userId.trim(),
            fromCurrency,
            toCurrency,
            amount
        };
    }
}

module.exports = ExchangeValidator;
