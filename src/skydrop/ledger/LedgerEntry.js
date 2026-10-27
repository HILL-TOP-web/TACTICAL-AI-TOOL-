'use strict';

const crypto = require('node:crypto');

class LedgerEntry {
  static create({
    journalId,
    reference,
    idempotencyKey,
    userId,
    counterpartyUserId,
    direction,
    amountMinor,
    currency,
    description,
    createdAt = new Date()
  }) {
    if (
      typeof journalId !== 'string' ||
      journalId.trim() === ''
    ) {
      throw new TypeError(
        'journalId is required.'
      );
    }

    if (
      typeof reference !== 'string' ||
      reference.trim() === ''
    ) {
      throw new TypeError(
        'reference is required.'
      );
    }

    if (
      typeof userId !== 'string' ||
      userId.trim() === ''
    ) {
      throw new TypeError(
        'userId is required.'
      );
    }

    if (!['DEBIT', 'CREDIT'].includes(direction)) {
      throw new TypeError(
        'direction must be DEBIT or CREDIT.'
      );
    }

    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      throw new TypeError(
        'amountMinor must be a positive integer.'
      );
    }

    const normalizedCurrency =
      String(currency || '').toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new TypeError(
        'currency must be a three-letter currency code.'
      );
    }

    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.trim() === ''
    ) {
      throw new TypeError(
        'idempotencyKey is required.'
      );
    }

    const timestamp = new Date(createdAt);

    if (Number.isNaN(timestamp.getTime())) {
      throw new TypeError(
        'createdAt must be a valid date.'
      );
    }

    return Object.freeze({
      entryId: crypto.randomUUID(),
      journalId,
      reference,
      idempotencyKey,
      userId,
      counterpartyUserId,
      direction,
      amountMinor,
      currency: normalizedCurrency,
      description: String(description || ''),
      createdAt: timestamp,
      schemaVersion: 1
    });
  }
}

module.exports = LedgerEntry;
