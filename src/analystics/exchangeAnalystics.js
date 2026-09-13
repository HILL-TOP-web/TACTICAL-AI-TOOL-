'use strict';

class ExchangeAnalytics {
  constructor(options = {}) {
    this.records =
      options.records || new Map();
  }

  /**
   * Create exchange analytics record.
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

      totalSwaps: 0,

      successfulSwaps: 0,
      failedSwaps: 0,

      totalSKDSold: 0,
      totalUSDTReceived: 0,

      totalVolumeUSDT: 0,

      largestSwapSKD: 0,
      largestSwapUSDT: 0,

      averageSwapSKD: 0,
      averageSwapUSDT: 0,

      lastSwapAt: null,

      pairs: {
        'SKD/USDT': {
          count: 0,
          skdVolume: 0,
          usdtVolume: 0
        }
      },

      createdAt: now,
      updatedAt: now
    };

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Get exchange analytics.
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
   * Record successful SKD -> USDT swap.
   */
  recordSKDToUSDT({
    userId,
    skdAmount,
    usdtAmount,
    rate
  }) {
    const record =
      this.ensureRecord(userId);

    const skd =
      this.validateAmount(skdAmount);

    const usdt =
      this.validateAmount(usdtAmount);

    const exchangeRate =
      this.validateRate(rate);

    record.totalSwaps += 1;
    record.successfulSwaps += 1;

    record.totalSKDSold += skd;
    record.totalUSDTReceived += usdt;

    record.totalVolumeUSDT += usdt;

    if (
      skd > record.largestSwapSKD
    ) {
      record.largestSwapSKD = skd;
    }

    if (
      usdt > record.largestSwapUSDT
    ) {
      record.largestSwapUSDT = usdt;
    }

    record.averageSwapSKD =
      record.successfulSwaps > 0
        ? record.totalSKDSold /
          record.successfulSwaps
        : 0;

    record.averageSwapUSDT =
      record.successfulSwaps > 0
        ? record.totalUSDTReceived /
          record.successfulSwaps
        : 0;

    const pair =
      record.pairs['SKD/USDT'];

    pair.count += 1;
    pair.skdVolume += skd;
    pair.usdtVolume += usdt;

    record.lastSwapAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastSwapAt;

    this.records.set(userId, record);

    return {
      ...this.get(userId),

      lastRate: exchangeRate
    };
  }

  /**
   * Record failed swap.
   */
  recordFailedSwap(
    userId,
    reason = null
  ) {
    const record =
      this.ensureRecord(userId);

    record.totalSwaps += 1;
    record.failedSwaps += 1;

    record.lastSwapAt =
      new Date().toISOString();

    record.updatedAt =
      record.lastSwapAt;

    this.records.set(userId, record);

    return {
      ...this.get(userId),

      lastFailureReason: reason
    };
  }

  /**
   * Calculate success rate.
   */
  getSuccessRate(userId) {
    const record =
      this.get(userId);

    if (
      record.totalSwaps === 0
    ) {
      return 0;
    }

    return (
      record.successfulSwaps /
      record.totalSwaps
    ) * 100;
  }

  /**
   * Calculate average SKD swap size.
   */
  getAverageSKDSwap(userId) {
    const record =
      this.get(userId);

    if (
      record.successfulSwaps === 0
    ) {
      return 0;
    }

    return (
      record.totalSKDSold /
      record.successfulSwaps
    );
  }

  /**
   * Calculate average USDT received.
   */
  getAverageUSDTSwap(userId) {
    const record =
      this.get(userId);

    if (
      record.successfulSwaps === 0
    ) {
      return 0;
    }

    return (
      record.totalUSDTReceived /
      record.successfulSwaps
    );
  }

  /**
   * Return exchange summary.
   */
  getSummary(userId) {
    const record =
      this.get(userId);

    return {
      userId,

      totalSwaps:
        record.totalSwaps,

      successfulSwaps:
        record.successfulSwaps,

      failedSwaps:
        record.failedSwaps,

      successRate:
        this.getSuccessRate(userId),

      SKD: {
        totalSold:
          record.totalSKDSold,

        largestSwap:
          record.largestSwapSKD,

        averageSwap:
          this.getAverageSKDSwap(userId)
      },

      USDT: {
        totalReceived:
          record.totalUSDTReceived,

        largestSwap:
          record.largestSwapUSDT,

        averageSwap:
          this.getAverageUSDTSwap(userId)
      },

      totalVolumeUSDT:
        record.totalVolumeUSDT,

      pairs:
        this.clone(record.pairs),

      lastSwapAt:
        record.lastSwapAt
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
        'Amount must be greater than zero.'
      );
    }

    return value;
  }

  /**
   * Validate exchange rate.
   */
  validateRate(rate) {
    const value = Number(rate);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Exchange rate must be greater than zero.'
      );
    }

    return value;
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
   * Clone object.
   */
  clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

module.exports = ExchangeAnalytics;
