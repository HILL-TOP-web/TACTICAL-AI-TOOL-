'use strict';

const swapValidator = require('./swapValidator');

class RateProvider {
  constructor(options = {}) {
    this.rates = new Map();

    if (options.rates) {
      this.setRates(options.rates);
    }
  }

  /**
   * Normalize a trading pair.
   */
  pairKey(fromAsset, toAsset) {
    return `${fromAsset.toUpperCase()}/${toAsset.toUpperCase()}`;
  }

  /**
   * Set a market rate.
   *
   * Example:
   * setRate('SKD', 'USDT', 0.01)
   */
  setRate(fromAsset, toAsset, rate) {
    const from = swapValidator.validateAsset(fromAsset);
    const to = swapValidator.validateAsset(toAsset);

    const normalizedRate = Number(rate);

    if (
      !Number.isFinite(normalizedRate) ||
      normalizedRate <= 0
    ) {
      throw new Error('Exchange rate must be greater than zero.');
    }

    const key = this.pairKey(from, to);

    this.rates.set(key, {
      fromAsset: from,
      toAsset: to,
      rate: normalizedRate,
      updatedAt: new Date().toISOString()
    });

    return this.rates.get(key);
  }

  /**
   * Set multiple rates.
   */
  setRates(rates) {
    if (!rates || typeof rates !== 'object') {
      throw new Error('Rates must be an object.');
    }

    for (const [pair, rate] of Object.entries(rates)) {
      const [fromAsset, toAsset] = pair.split('/');

      if (!fromAsset || !toAsset) {
        throw new Error(`Invalid trading pair: ${pair}`);
      }

      this.setRate(
        fromAsset,
        toAsset,
        rate
      );
    }

    return this.getAllRates();
  }

  /**
   * Get a rate.
   */
  getRate(fromAsset, toAsset) {
    const key = this.pairKey(
      fromAsset,
      toAsset
    );

    const result = this.rates.get(key);

    if (!result) {
      throw new Error(
        `No exchange rate available for ${key}.`
      );
    }

    return {
      ...result
    };
  }

  /**
   * Remove a rate.
   */
  removeRate(fromAsset, toAsset) {
    const key = this.pairKey(
      fromAsset,
      toAsset
    );

    return this.rates.delete(key);
  }

  /**
   * Return all configured rates.
   */
  getAllRates() {
    return Object.fromEntries(
      Array.from(this.rates.entries()).map(
        ([key, value]) => [
          key,
          {
            ...value
          }
        ]
      )
    );
  }
}

module.exports = new RateProvider();
