'use strict';

const ALLOWED_TYPES = Object.freeze([
  'deposit',
  'transfer',
  'withdrawal',
  'exchange',
  'reward',
  'adjustment'
]);

const ALLOWED_CURRENCIES = Object.freeze([
  'NGN',
  'USD',
  'USDT',
  'SKD'
]);

class TransactionValidator {
  validateCreate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Transaction input is required.');
    }

    if (!ALLOWED_TYPES.includes(input.type)) {
      throw new Error('Unsupported transaction type.');
    }

    if (
      !Number.isSafeInteger(input.amountMinor) ||
      input.amountMinor <= 0
    ) {
      throw new Error(
        'amountMinor must be a positive safe integer.'
      );
    }

    if (!ALLOWED_CURRENCIES.includes(input.currency)) {
      throw new Error('Unsupported currency.');
    }

    if (
      typeof input.idempotencyKey !== 'string' ||
      input.idempotencyKey.length < 16 ||
      input.idempotencyKey.length > 128
    ) {
      throw new Error(
        'A valid idempotency key is required.'
      );
    }

    if (
      input.description !== undefined &&
      (
        typeof input.description !== 'string' ||
        input.description.length > 500
      )
    ) {
      throw new Error('Invalid transaction description.');
    }

    if (
      input.metadata !== undefined &&
      (
        input.metadata === null ||
        typeof input.metadata !== 'object' ||
        Array.isArray(input.metadata)
      )
    ) {
      throw new Error(
        'Transaction metadata must be an object.'
      );
    }

    return true;
  }
}

module.exports = TransactionValidator;
