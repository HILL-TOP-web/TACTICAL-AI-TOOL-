'use strict';

/*
 * SkyDrop trading rules.
 *
 * Trading can be controlled through configuration
 * rather than hard-coding a permanent price or
 * silently allowing swaps.
 */

class TradingRules {
  constructor(options = {}) {
    this.enabled =
      options.enabled !== undefined
        ? Boolean(options.enabled)
        : false;

    this.startTime =
      options.startTime || null;

    this.minSwapAmount =
      options.minSwapAmount !== undefined
        ? Number(options.minSwapAmount)
        : 0;

    this.maxSwapAmount =
      options.maxSwapAmount !== undefined
        ? Number(options.maxSwapAmount)
        : null;

    this.allowedPairs =
      options.allowedPairs || [
        'SKD/USDT'
      ];
  }

  /**
   * Determine whether trading is currently enabled.
   */
  getTradingStatus(now = new Date()) {
    if (!this.enabled) {
      return {
        enabled: false,
        reason: 'Trading is currently disabled.'
      };
    }

    if (this.startTime) {
      const start =
        new Date(this.startTime);

      if (
        Number.isNaN(start.getTime())
      ) {
        throw new Error(
          'Invalid trading start time.'
        );
      }

      if (now < start) {
        return {
          enabled: false,
          reason:
            `Trading starts on ${start.toISOString()}.`
        };
      }
    }

    return {
      enabled: true,
      reason: 'Trading is enabled.'
    };
  }

  /**
   * Check whether a pair is allowed.
   */
  isPairAllowed(fromAsset, toAsset) {
    const pair =
      `${String(fromAsset).toUpperCase()}/${String(toAsset).toUpperCase()}`;

    return this.allowedPairs.includes(pair);
  }

  /**
   * Validate a proposed swap against rules.
   */
  validateSwap({
    fromAsset,
    toAsset,
    amount
  }) {
    const status =
      this.getTradingStatus();

    if (!status.enabled) {
      throw new Error(status.reason);
    }

    if (
      !this.isPairAllowed(
        fromAsset,
        toAsset
      )
    ) {
      throw new Error(
        `Trading pair ${fromAsset}/${toAsset} is not allowed.`
      );
    }

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Invalid swap amount.'
      );
    }

    if (
      value < this.minSwapAmount
    ) {
      throw new Error(
        `Swap amount is below the minimum of ${this.minSwapAmount}.`
      );
    }

    if (
      this.maxSwapAmount !== null &&
      value > this.maxSwapAmount
    ) {
      throw new Error(
        `Swap amount exceeds the maximum of ${this.maxSwapAmount}.`
      );
    }

    return true;
  }

  /**
   * Enable trading.
   */
  enable() {
    this.enabled = true;

    return this.getTradingStatus();
  }

  /**
   * Disable trading.
   */
  disable() {
    this.enabled = false;

    return this.getTradingStatus();
  }

  /**
   * Configure the trading start time.
   */
  setStartTime(startTime) {
    const date =
      new Date(startTime);

    if (
      Number.isNaN(date.getTime())
    ) {
      throw new Error(
        'Invalid trading start time.'
      );
    }

    this.startTime =
      date.toISOString();

    return this.startTime;
  }

  /**
   * Return current rules.
   */
  getRules() {
    return {
      enabled: this.enabled,
      startTime: this.startTime,
      minSwapAmount: this.minSwapAmount,
      maxSwapAmount: this.maxSwapAmount,
      allowedPairs: [
        ...this.allowedPairs
      ]
    };
  }
}

module.exports = new TradingRules();
