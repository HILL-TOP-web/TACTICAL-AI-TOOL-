'use strict';

class ExchangeValidator {
    constructor(options = {}) {
        this.supportedCurrencies = new Set(
            (options.supportedCurrencies || [
                'SKD',
                'USD',
                'NGN',
                'USDT'
            ]).map(currency =>
                String(currency).trim().toUpperCase()
            )
        );

        this.minimumAmount = options.minimumAmount ?? 0.00000001;

        this.maximumAmount =
            options.maximumAmount ?? 1_000_000_000;
    }

    validateUserId(userId) {
        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error(
                'A valid user ID is required.'
            );
        }

        return userId.trim();
    }

    validateCurrency(currency) {
        if (typeof currency !== 'string') {
            throw new Error(
                'Currency must be a string.'
            );
        }

        const normalized = currency.trim().toUpperCase();

        if (!this.supportedCurrencies.has(normalized)) {
            throw new Error(
                `Unsupported currency: ${normalized || '(empty)'}.`
            );
        }

        return normalized;
    }

    validateAmount(amount) {
        if (
            typeof amount !== 'number' &&
            typeof amount !== 'string'
        ) {
            throw new Error(
                'Amount must be a number or numeric string.'
            );
        }

        if (
            typeof amount === 'string' &&
            !/^\d+(\.\d+)?$/.test(amount.trim())
        ) {
            throw new Error(
                'Amount must use a valid positive decimal format.'
            );
        }

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            throw new Error(
                'Amount must be finite.'
            );
        }

        if (value < this.minimumAmount) {
            throw new Error(
                `Amount must be at least ${this.minimumAmount}.`
            );
        }

        if (value > this.maximumAmount) {
            throw new Error(
                `Amount cannot exceed ${this.maximumAmount}.`
            );
        }

        return value;
    }

    validateIdempotencyKey(key) {
        if (
            typeof key !== 'string' ||
            !/^[A-Za-z0-9_-]{16,128}$/.test(key)
        ) {
            throw new Error(
                'A valid idempotency key of 16–128 characters is required.'
            );
        }

        return key;
    }

    validateSwapRequest(request) {
        if (
            !request ||
            typeof request !== 'object' ||
            Array.isArray(request)
        ) {
            throw new Error(
                'Swap request must be an object.'
            );
        }

        const userId = this.validateUserId(request.userId);

        const fromCurrency =
            this.validateCurrency(request.fromCurrency);

        const toCurrency =
            this.validateCurrency(request.toCurrency);

        const amount = this.validateAmount(request.amount);

        const idempotencyKey =
            this.validateIdempotencyKey(
                request.idempotencyKey
            );

        if (fromCurrency === toCurrency) {
            throw new Error(
                'Source and destination currencies must differ.'
            );
        }

        return {
            userId,
            fromCurrency,
            toCurrency,
            amount,
            idempotencyKey
        };
    }

    validateRate(rate) {
        const value = Number(rate);

        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {
            throw new Error(
                'Exchange rate must be positive and finite.'
            );
        }

        return value;
    }
}

module.exports = ExchangeValidator;
