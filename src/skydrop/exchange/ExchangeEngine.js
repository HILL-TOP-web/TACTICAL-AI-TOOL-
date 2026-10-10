// tactical-ai/src/skydrop/exchange/ExchangeEngine.js

const config = require("./exchangeConfig");

class ExchangeEngine {
    getStatus() {
        const now = Date.now();
        const startTime = Date.parse(config.TRADING_START_DATE);

        return {
            enabled:
                config.TRADING_ENABLED &&
                Number.isFinite(startTime) &&
                now >= startTime,

            scheduledStart: config.TRADING_START_DATE,

            supportedCurrencies: [
                ...config.SUPPORTED_CURRENCIES
            ],

            error:
                !config.TRADING_ENABLED || now < startTime
                    ? "trading-disabled"
                    : null
        };
    }

    validateExchange({ amount, fromCurrency, toCurrency }) {
        const status = this.getStatus();

        if (!status.enabled) {
            const error = new Error(
                "Trading is not available yet."
            );

            error.code = "trading-disabled";
            throw error;
        }

        if (!Number.isFinite(amount) ||
            amount < config.MINIMUM_EXCHANGE_AMOUNT) {
            throw new Error("Invalid exchange amount.");
        }

        if (
            !config.SUPPORTED_CURRENCIES.includes(fromCurrency) ||
            !config.SUPPORTED_CURRENCIES.includes(toCurrency)
        ) {
            throw new Error("Unsupported currency.");
        }

        if (fromCurrency === toCurrency) {
            throw new Error(
                "Source and destination currencies must differ."
            );
        }

        return true;
    }

    async exchange() {
        throw new Error(
            "Exchange execution requires an approved rate source, " +
            "a persistent ledger, and atomic balance operations."
        );
    }
}

module.exports = ExchangeEngine;
