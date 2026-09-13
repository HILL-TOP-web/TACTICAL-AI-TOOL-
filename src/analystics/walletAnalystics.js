'use strict';

class WalletAnalytics {
  constructor(options = {}) {
    this.records =
      options.records || new Map();
  }

  /**
   * Create wallet analytics record.
   */
  create(userId) {
    this.validateUserId(userId);

    if (this.records.has(userId)) {
      return this.get(userId);
    }

    const now =
      new Date().toISOString();

    const record = {
      userId,

      balances: {
        SKD: 0,
        USDT: 0
      },

      totalDeposits: 0,
      totalWithdrawals: 0,

      depositCount: 0,
      withdrawalCount: 0,

      transferCount: 0,
      receivedTransferCount: 0,
      sentTransferCount: 0,

      totalSentSKD: 0,
      totalReceivedSKD: 0,

      totalSentUSDT: 0,
      totalReceivedUSDT: 0,

      largestDeposit: 0,
      largestWithdrawal: 0,
      largestTransfer: 0,

      failedTransactions: 0,

      lastTransactionAt: null,

      createdAt: now,
      updatedAt: now
    };

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Get wallet analytics.
   */
  get(userId) {
    this.validateUserId(userId);

    if (!this.records.has(userId)) {
      return this.create(userId);
    }

    return this.clone(
      this.records.get(userId)
    );
  }

  /**
   * Update current wallet balances.
   */
  updateBalances(
    userId,
    balances = {}
  ) {
    const record =
      this.ensureRecord(userId);

    if (
      balances.SKD !== undefined
    ) {
      this.validateBalance(
        balances.SKD
      );

      record.balances.SKD =
        Number(balances.SKD);
    }

    if (
      balances.USDT !== undefined
    ) {
      this.validateBalance(
        balances.USDT
      );

      record.balances.USDT =
        Number(balances.USDT);
    }

    record.updatedAt =
      new Date().toISOString();

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record a deposit.
   */
  recordDeposit(
    userId,
    asset,
    amount
  ) {
    const record =
      this.ensureRecord(userId);

    const normalizedAsset =
      this.validateAsset(asset);

    const value =
      this.validateAmount(amount);

    record.totalDeposits += value;
    record.depositCount += 1;

    if (
      value > record.largestDeposit
    ) {
      record.largestDeposit = value;
    }

    record.lastTransactionAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastTransactionAt;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record a withdrawal.
   */
  recordWithdrawal(
    userId,
    asset,
    amount
  ) {
    const record =
      this.ensureRecord(userId);

    this.validateAsset(asset);

    const value =
      this.validateAmount(amount);

    record.totalWithdrawals += value;
    record.withdrawalCount += 1;

    if (
      value > record.largestWithdrawal
    ) {
      record.largestWithdrawal =
        value;
    }

    record.lastTransactionAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastTransactionAt;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record outgoing transfer.
   */
  recordSentTransfer(
    userId,
    asset,
    amount
  ) {
    const record =
      this.ensureRecord(userId);

    const normalizedAsset =
      this.validateAsset(asset);

    const value =
      this.validateAmount(amount);

    record.transferCount += 1;
    record.sentTransferCount += 1;

    if (
      normalizedAsset === 'SKD'
    ) {
      record.totalSentSKD += value;
    }

    if (
      normalizedAsset === 'USDT'
    ) {
      record.totalSentUSDT += value;
    }

    if (
      value > record.largestTransfer
    ) {
      record.largestTransfer = value;
    }

    record.lastTransactionAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastTransactionAt;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record incoming transfer.
   */
  recordReceivedTransfer(
    userId,
    asset,
    amount
  ) {
    const record =
      this.ensureRecord(userId);

    const normalizedAsset =
      this.validateAsset(asset);

    const value =
      this.validateAmount(amount);

    record.transferCount += 1;
    record.receivedTransferCount += 1;

    if (
      normalizedAsset === 'SKD'
    ) {
      record.totalReceivedSKD += value;
    }

    if (
      normalizedAsset === 'USDT'
    ) {
      record.totalReceivedUSDT += value;
    }

    if (
      value > record.largestTransfer
    ) {
      record.largestTransfer = value;
    }

    record.lastTransactionAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastTransactionAt;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record failed transaction.
   */
  recordFailedTransaction(userId) {
    const record =
      this.ensureRecord(userId);

    record.failedTransactions += 1;

    record.lastTransactionAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastTransactionAt;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Return wallet summary.
   */
  getSummary(userId) {
    const record =
      this.get(userId);

    return {
      userId,

      balances: {
        ...record.balances
      },

      deposits: {
        total: record.totalDeposits,
        count: record.depositCount,
        largest: record.largestDeposit
      },

      withdrawals: {
        total: record.totalWithdrawals,
        count: record.withdrawalCount,
        largest: record.largestWithdrawal
      },

      transfers: {
        totalCount: record.transferCount,
        sentCount:
          record.sentTransferCount,
        receivedCount:
          record.receivedTransferCount,
        largest:
          record.largestTransfer
      },

      SKD: {
        sent: record.totalSentSKD,
        received:
          record.totalReceivedSKD
      },

      USDT: {
        sent: record.totalSentUSDT,
        received:
          record.totalReceivedUSDT
      },

      failedTransactions:
        record.failedTransactions,

      lastTransactionAt:
        record.lastTransactionAt
    };
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

    if (
      normalized !== 'SKD' &&
      normalized !== 'USDT'
    ) {
      throw new Error(
        `Unsupported asset: ${normalized}`
      );
    }

    return normalized;
  }

  /**
   * Validate positive amount.
   */
  validateAmount(amount) {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Amount must be greater than zero.'
      );
    }

    return value;
  }

  /**
   * Validate balance.
   */
  validateBalance(balance) {
    const value = Number(balance);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        'Balance cannot be negative.'
      );
    }

    return value;
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
  }

  /**
   * Ensure record exists.
   */
  ensureRecord(userId) {
    if (!this.records.has(userId)) {
      this.create(userId);
    }

    return this.records.get(userId);
  }

  /**
   * Clone data.
   */
  clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

module.exports = WalletAnalytics;
