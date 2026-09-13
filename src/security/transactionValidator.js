'use strict';

const crypto = require('crypto');

class TransactionValidator {
  constructor(options = {}) {
    this.maxAmount =
      options.maxAmount !== undefined
        ? Number(options.maxAmount)
        : null;

    this.supportedAssets =
      options.supportedAssets || new Set([
        'SKD',
        'USDT'
      ]);
  }

  /**
   * Validate a transaction object.
   */
  validate(transaction) {
    if (
      !transaction ||
      typeof transaction !== 'object'
    ) {
      throw new Error(
        'Transaction object is required.'
      );
    }

    const {
      userId,
      type,
      asset,
      amount
    } = transaction;

    this.validateUserId(userId);
    this.validateType(type);
    this.validateAsset(asset);

    const normalizedAmount =
      this.validateAmount(amount);

    if (
      this.maxAmount !== null &&
      normalizedAmount > this.maxAmount
    ) {
      throw new Error(
        'Transaction amount exceeds the allowed limit.'
      );
    }

    return {
      ...transaction,
      userId: userId.trim(),
      type: type.trim().toUpperCase(),
      asset: asset.trim().toUpperCase(),
      amount: normalizedAmount
    };
  }

  /**
   * Validate user ID.
   */
  validateUserId(userId) {
    if (
      typeof userId !== 'string' ||
      userId.trim().length === 0
    ) {
      throw new Error(
        'Valid user ID is required.'
      );
    }

    if (userId.length > 128) {
      throw new Error(
        'User ID is too long.'
      );
    }

    return userId.trim();
  }

  /**
   * Validate transaction type.
   */
  validateType(type) {
    if (typeof type !== 'string') {
      throw new Error(
        'Transaction type must be a string.'
      );
    }

    const normalized =
      type.trim().toUpperCase();

    const allowedTypes = new Set([
      'TRANSFER',
      'DEPOSIT',
      'WITHDRAWAL',
      'SWAP',
      'MINT',
      'BURN',
      'MINING_REWARD'
    ]);

    if (!allowedTypes.has(normalized)) {
      throw new Error(
        `Unsupported transaction type: ${normalized}`
      );
    }

    return normalized;
  }

  /**
   * Validate asset.
   */
  validateAsset(asset) {
    if (typeof asset !== 'string') {
      throw new Error(
        'Asset must be a string.'
      );
    }

    const normalized =
      asset.trim().toUpperCase();

    if (!this.supportedAssets.has(normalized)) {
      throw new Error(
        `Unsupported asset: ${normalized}`
      );
    }

    return normalized;
  }

  /**
   * Validate amount.
   */
  validateAmount(amount) {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Transaction amount must be greater than zero.'
      );
    }

    return value;
  }

  /**
   * Create a transaction ID.
   */
  generateTransactionId() {
    return crypto.randomUUID();
  }

  /**
   * Create a transaction object after validation.
   */
  createTransaction(data) {
    const validated =
      this.validate(data);

    return {
      transactionId:
        this.generateTransactionId(),

      ...validated,

      status: 'pending',

      createdAt:
        new Date().toISOString()
    };
  }
}

module.exports = TransactionValidator;
