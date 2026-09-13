'use strict';

class MiningRate {
  constructor(options = {}) {
    this.baseRate = Number(
      options.baseRate ?? 0.00001
    );

    this.intervalMs = Number(
      options.intervalMs ?? 5 * 60 * 1000
    );

    if (this.baseRate <= 0) {
      throw new Error('baseRate must be greater than zero');
    }

    if (this.intervalMs <= 0) {
      throw new Error('intervalMs must be greater than zero');
    }
  }

  calculateReward({
    elapsedMs,
    multiplier = 1
  }) {
    if (elapsedMs <= 0) {
      return 0;
    }

    if (multiplier <= 0) {
      throw new Error('Mining multiplier must be greater than zero');
    }

    const intervals =
      elapsedMs / this.intervalMs;

    const reward =
      intervals *
      this.baseRate *
      Number(multiplier);

    return this.round(reward);
  }

  getRate(multiplier = 1) {
    return this.round(
      this.baseRate * Number(multiplier)
    );
  }

  getBaseRate() {
    return this.baseRate;
  }

  getIntervalMs() {
    return this.intervalMs;
  }

  round(value) {
    return Number(value.toFixed(12));
  }
}

module.exports = MiningRate;
