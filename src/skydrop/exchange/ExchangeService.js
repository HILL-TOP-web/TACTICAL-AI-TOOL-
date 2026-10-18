'use strict';

const ExchangeConfig = require('./ExchangeConfig');
const ExchangeValidator = require('./ExchangeValidator');

class ExchangeService {
    constructor({
        walletService,
        conversionService,
        exchangeExecutor,
        clock = () => Date.now()
    }) {
        if (!walletService) {
            throw new Error('walletService is required.');
        }

        if (!conversionService) {
            throw new Error('conversionService is required.');
        }

        if (!exchangeExecutor) {
            throw new Error('exchangeExecutor is required.');
        }

        this.walletService = walletService;
        this.conversionService = conversionService;
        this.exchangeExecutor = exchangeExecutor;
        this.clock = clock;
    }

    assertTradingAvailable() {
        if (!ExchangeConfig.enabled) {
            throw new Error('Exchange is disabled.');
        }

        if (!ExchangeConfig.trading.enabled) {
            throw new Error('trading-disabled');
        }

        /*
         * The configured date is interpreted as Lagos local time.
         * Deployment environments should use synchronized clocks.
         */
        const startTime = new Date(
            '2027-01-01T10:00:00+01:00'
        ).getTime();

        if (this.clock() < startTime) {
            const error = new Error(
                ExchangeConfig.trading.message
            );

            error.code = 'trading-disabled';

            throw error;
        }
    }

    async exchange(request) {
        const validated = ExchangeValidator.validate(request);

        this.assertTradingAvailable();

        /*
         * The executor must perform the real atomic wallet debit,
         * credit, ledger updates and idempotency checks.
         *
         * conversionService supplies a quote, not proof that
         * the destination currency can be redeemed for cash.
         */

        const quote = await this.conversionService.getQuote({
            fromCurrency: validated.fromCurrency,
            toCurrency: validated.toCurrency,
            amount: validated.amount
        });

        if (
            !quote ||
            typeof quote.outputAmount !== 'number' ||
            !Number.isFinite(quote.outputAmount) ||
            quote.outputAmount <= 0
        ) {
            throw new Error('A valid exchange quote is unavailable.');
        }

        return this.exchangeExecutor.execute({
            ...validated,
            quote,
            operation: 'exchange'
        });
    }
}

module.exports = ExchangeService;
