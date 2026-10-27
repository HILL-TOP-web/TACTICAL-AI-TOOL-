'use strict';

class LedgerValidator {
  static validateUserId(userId) {
    if (
      typeof userId !== 'string' ||
      userId.trim() === ''
    ) {
      throw new TypeError(
        'A valid userId is required.'
      );
    }

    return userId.trim();
  }

  static validateReference(reference) {
    if (
      typeof reference !== 'string' ||
      reference.trim() === '' ||
      reference.length > 150
    ) {
      throw new TypeError(
        'A valid transaction reference is required.'
      );
    }

    return reference.trim();
  }

  static validateIdempotencyKey(idempotencyKey) {
    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.trim() === '' ||
      idempotencyKey.length > 150
    ) {
      throw new TypeError(
        'A valid idempotency key is required.'
      );
    }

    return idempotencyKey.trim();
  }

  static validateAmountMinor(amountMinor) {
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      throw new TypeError(
        'Amount must be a positive integer in minor units.'
      );
    }

    return amountMinor;
  }

  static validateCurrency(currency = 'NGN') {
    const normalized = String(currency).toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new TypeError(
        'Currency must be a valid three-letter code.'
      );
    }

    return normalized;
  }

  static validateTransfer(input) {
    if (!input || typeof input !== 'object') {
      throw new TypeError(
        'Transfer input is required.'
      );
    }

    return {
      fromUserId: this.validateUserId(input.fromUserId),
      toUserId: this.validateUserId(input.toUserId),
      amountMinor: this.validateAmountMinor(
        input.amountMinor
      ),
      currency: this.validateCurrency(input.currency),
      reference: this.validateReference(input.reference),
      idempotencyKey: this.validateIdempotencyKey(
        input.idempotencyKey
      )
    };
  }
}

module.exports = LedgerValidator;
