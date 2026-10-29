'use strict';

const { validateAmount, validateCurrency } = require(
    './TransactionValidator'
);

class BalanceValidationError extends Error {
    constructor(message, code = 'INSUFFICIENT_BALANCE') {
        super(message);

        this.name = 'BalanceValidationError';
        this.code = code;
        this.statusCode = 400;
    }
}

function toDecimalString(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return '0';
    }

    if (
        typeof value === 'object' &&
        typeof value.toString === 'function'
    ) {
        return value.toString();
    }

    return String(value);
}

/*
 * Compare decimal strings without converting financial amounts
 * to JavaScript floating-point numbers.
 */
function compareDecimals(left, right) {
    function parse(value) {
        const normalized = toDecimalString(value);

        if (!/^\d+(\.\d+)?$/.test(normalized)) {
            throw new BalanceValidationError(
                'Invalid balance or transaction amount.',
                'INVALID_DECIMAL'
            );
        }

        const parts = normalized.split('.');
        const integer = parts[0].replace(/^0+(?=\d)/, '');
        const fraction = parts[1] || '';

        return {
            integer,
            fraction
        };
    }

    const a = parse(left);
    const b = parse(right);

    if (a.integer.length !== b.integer.length) {
        return a.integer.length > b.integer.length ? 1 : -1;
    }

    if (a.integer !== b.integer) {
        return a.integer > b.integer ? 1 : -1;
    }

    const precision = Math.max(
        a.fraction.length,
        b.fraction.length
    );

    const fractionA = a.fraction.padEnd(precision, '0');
    const fractionB = b.fraction.padEnd(precision, '0');

    if (fractionA === fractionB) {
        return 0;
    }

    return fractionA > fractionB ? 1 : -1;
}

class BalanceValidator {
    constructor({ walletService }) {
        if (
            !walletService ||
            typeof walletService.getAvailableBalance !== 'function'
        ) {
            throw new TypeError(
                'BalanceValidator requires a WalletService exposing getAvailableBalance().'
            );
        }

        this.walletService = walletService;
    }

    async assertSufficientBalance({
        userId,
        currency,
        amount,
        session
    }) {
        if (!userId) {
            throw new BalanceValidationError(
                'A wallet owner is required.',
                'MISSING_USER_ID'
            );
        }

        const normalizedCurrency = validateCurrency(currency);
        const normalizedAmount = validateAmount(amount);

        const balance = await this.walletService.getAvailableBalance({
            userId,
            currency: normalizedCurrency,
            session
        });

        if (balance === null || balance === undefined) {
            throw new BalanceValidationError(
                'The wallet balance could not be retrieved.',
                'BALANCE_UNAVAILABLE'
            );
        }

        const available = toDecimalString(balance);

        if (compareDecimals(available, normalizedAmount) < 0) {
            throw new BalanceValidationError(
                'Insufficient available balance.',
                'INSUFFICIENT_BALANCE'
            );
        }

        return {
            userId: String(userId),
            currency: normalizedCurrency,
            amount: normalizedAmount,
            availableBalance: available,
            sufficient: true
        };
    }
}

module.exports = {
    BalanceValidator,
    BalanceValidationError,
    compareDecimals
};
