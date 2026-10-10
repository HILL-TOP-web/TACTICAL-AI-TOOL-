'use strict';

class ExchangeRates {
    constructor(options = {}) {
        this.rates = new Map();

        this.maxRateAgeMs =
            options.maxRateAgeMs ?? 5 * 60 * 1000;

        this.clock =
            options.clock || (() => Date.now());
    }

    normalizeCurrency(currency) {
        if (typeof currency !== 'string') {
            throw new TypeError(
                'Currency must be a string.'
            );
        }

        const normalized = currency.trim().toUpperCase();

        if (!/^[A-Z0-9]{2,12}$/.test(normalized)) {
            throw new Error(
                'Invalid currency code.'
            );
        }

        return normalized;
    }

    createPair(fromCurrency, toCurrency) {
        const from = this.normalizeCurrency(fromCurrency);
        const to = this.normalizeCurrency(toCurrency);

        if (from === to) {
            throw new Error(
                'Source and destination currencies must differ.'
            );
        }

        return `${from}:${to}`;
    }

    setRate(fromCurrency, toCurrency, rate, options = {}) {
        const pair = this.createPair(
            fromCurrency,
            toCurrency
        );

        const numericRate = Number(rate);

        if (
            !Number.isFinite(numericRate) ||
            numericRate <= 0
        ) {
            throw new Error(
                'Exchange rate must be a positive finite number.'
            );
        }

        const timestamp =
            options.timestamp ?? this.clock();

        if (
            !Number.isSafeInteger(timestamp) ||
            timestamp > this.clock()
        ) {
            throw new Error(
                'Invalid exchange-rate timestamp.'
            );
        }

        const record = {
            fromCurrency: this.normalizeCurrency(fromCurrency),
            toCurrency: this.normalizeCurrency(toCurrency),
            rate: numericRate,
            timestamp,
            source: options.source || 'manual',
            expiresAt:
                options.expiresAt ??
                timestamp + this.maxRateAgeMs
        };

        if (
            !Number.isSafeInteger(record.expiresAt) ||
            record.expiresAt <= timestamp
        ) {
            throw new Error(
                'Exchange-rate expiry must follow its timestamp.'
            );
        }

        this.rates.set(pair, Object.freeze(record));

        return { ...record };
    }

    getRate(fromCurrency, toCurrency) {
        const pair = this.createPair(
            fromCurrency,
            toCurrency
        );

        const record = this.rates.get(pair);

        if (!record) {
            throw new Error(
                `Exchange rate not found for ${pair}.`
            );
        }

        if (this.clock() >= record.expiresAt) {
            throw new Error(
                `Exchange rate expired for ${pair}.`
            );
        }

        return { ...record };
    }

    calculate(fromCurrency, toCurrency, amount) {
        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            throw new Error(
                'Exchange amount must be positive.'
            );
        }

        const record = this.getRate(
            fromCurrency,
            toCurrency
        );

        const result = numericAmount * record.rate;

        if (!Number.isFinite(result)) {
            throw new Error(
                'Calculated exchange amount is invalid.'
            );
        }

        return {
            fromCurrency: record.fromCurrency,
            toCurrency: record.toCurrency,
            amount: numericAmount,
            rate: record.rate,
            result,
            rateTimestamp: record.timestamp,
            rateSource: record.source
        };
    }

    removeRate(fromCurrency, toCurrency) {
        const pair = this.createPair(
            fromCurrency,
            toCurrency
        );

        return this.rates.delete(pair);
    }

    listRates() {
        const now = this.clock();

        return Array.from(this.rates.values())
            .filter(rate => rate.expiresAt > now)
            .map(rate => ({ ...rate }));
    }

    clearExpiredRates() {
        const now = this.clock();
        let removed = 0;

        for (const [pair, record] of this.rates.entries()) {
            if (record.expiresAt <= now) {
                this.rates.delete(pair);
                removed++;
            }
        }

        return removed;
    }
}

module.exports = ExchangeRates;
