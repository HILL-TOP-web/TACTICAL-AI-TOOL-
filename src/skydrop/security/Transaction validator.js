'use strict';

const mongoose = require('mongoose');

const ALLOWED_CURRENCIES = new Set([
    'SKD',
    'USD',
    'NGN',
    'USDT'
]);

const ALLOWED_TRANSACTION_TYPES = new Set([
    'deposit',
    'withdrawal',
    'transfer',
    'reward',
    'mining',
    'conversion',
    'exchange',
    'reversal',
    'refund'
]);

const ALLOWED_TRANSACTION_STATUSES = new Set([
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'reversed',
    'requires_review'
]);

class TransactionValidationError extends Error {
    constructor(message, code = 'TRANSACTION_VALIDATION_FAILED') {
        super(message);

        this.name = 'TransactionValidationError';
        this.code = code;
        this.statusCode = 400;
    }
}

function fail(message, code) {
    throw new TransactionValidationError(message, code);
}

function validateAmount(amount) {
    if (
        amount === undefined ||
        amount === null ||
        typeof amount !== 'string' &&
        typeof amount !== 'number'
    ) {
        fail('A transaction amount is required.', 'INVALID_AMOUNT');
    }

    if (typeof amount === 'string' && amount.trim() === '') {
        fail('Transaction amount cannot be empty.', 'INVALID_AMOUNT');
    }

    if (typeof amount === 'number' && !Number.isFinite(amount)) {
        fail('Transaction amount must be finite.', 'INVALID_AMOUNT');
    }

    const normalized = String(amount).trim();

    if (!/^\d+(\.\d+)?$/.test(normalized)) {
        fail(
            'Transaction amount must be a positive decimal.',
            'INVALID_AMOUNT'
        );
    }

    if (/^0+(\.0+)?$/.test(normalized)) {
        fail(
            'Transaction amount must be greater than zero.',
            'INVALID_AMOUNT'
        );
    }

    if (normalized.length > 100) {
        fail('Transaction amount is too large.', 'INVALID_AMOUNT');
    }

    return normalized;
}

function validateCurrency(currency) {
    if (typeof currency !== 'string') {
        fail('A transaction currency is required.', 'INVALID_CURRENCY');
    }

    const normalized = currency.trim().toUpperCase();

    if (!ALLOWED_CURRENCIES.has(normalized)) {
        fail(
            `Unsupported transaction currency: ${normalized}.`,
            'UNSUPPORTED_CURRENCY'
        );
    }

    return normalized;
}

function validateTransactionType(type) {
    if (typeof type !== 'string') {
        fail(
            'A transaction type is required.',
            'INVALID_TRANSACTION_TYPE'
        );
    }

    const normalized = type.trim().toLowerCase();

    if (!ALLOWED_TRANSACTION_TYPES.has(normalized)) {
        fail(
            'This transaction type is not permitted.',
            'UNSUPPORTED_TRANSACTION_TYPE'
        );
    }

    return normalized;
}

function validateTransactionStatus(status) {
    if (typeof status !== 'string') {
        fail(
            'A transaction status is required.',
            'INVALID_TRANSACTION_STATUS'
        );
    }

    const normalized = status.trim().toLowerCase();

    if (!ALLOWED_TRANSACTION_STATUSES.has(normalized)) {
        fail(
            'The transaction status is not recognized.',
            'INVALID_TRANSACTION_STATUS'
        );
    }

    return normalized;
}

function validateIdentifier(value, fieldName = 'identifier') {
    if (
        typeof value !== 'string' ||
        value.trim().length === 0 ||
        value.length > 200
    ) {
        fail(
            `A valid ${fieldName} is required.`,
            'INVALID_IDENTIFIER'
        );
    }

    return value.trim();
}

function validateMongoId(value, fieldName = 'id') {
    if (!mongoose.isValidObjectId(value)) {
        fail(
            `A valid ${fieldName} is required.`,
            'INVALID_OBJECT_ID'
        );
    }

    return String(value);
}

function validateTransaction(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        fail('Transaction details must be an object.');
    }

    return {
        amount: validateAmount(input.amount),
        currency: validateCurrency(input.currency),
        type: validateTransactionType(input.type),
        reference: input.reference
            ? validateIdentifier(input.reference, 'reference')
            : undefined
    };
}

function assertOperationAllowed({
    operation,
    transactionStatus,
    actorId,
    ownerId
}) {
    const normalizedOperation = String(operation || '')
        .trim()
        .toLowerCase();

    const status = validateTransactionStatus(transactionStatus);

    if (!actorId || !ownerId) {
        fail(
            'The transaction owner and acting user are required.',
            'MISSING_ACTOR'
        );
    }

    if (String(actorId) !== String(ownerId)) {
        const error = new TransactionValidationError(
            'You are not authorized to perform this operation.',
            'OPERATION_FORBIDDEN'
        );

        error.statusCode = 403;

        throw error;
    }

    const permitted = {
        cancel: ['pending'],
        retry: ['failed'],
        reverse: ['completed'],
        inspect: [
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'reversed',
            'requires_review'
        ]
    };

    if (
        !Object.prototype.hasOwnProperty.call(
            permitted,
            normalizedOperation
        )
    ) {
        fail('This transaction operation is not permitted.');
    }

    if (!permitted[normalizedOperation].includes(status)) {
        fail(
            `Operation "${normalizedOperation}" is not permitted for status "${status}".`,
            'INVALID_TRANSACTION_STATE'
        );
    }

    return true;
}

module.exports = {
    ALLOWED_CURRENCIES,
    ALLOWED_TRANSACTION_TYPES,
    ALLOWED_TRANSACTION_STATUSES,
    TransactionValidationError,
    validateAmount,
    validateCurrency,
    validateTransactionType,
    validateTransactionStatus,
    validateIdentifier,
    validateMongoId,
    validateTransaction,
    assertOperationAllowed
};
