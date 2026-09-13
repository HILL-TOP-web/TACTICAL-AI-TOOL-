'use strict';

class MiningRewards {
  constructor(options = {}) {
    this.minimumClaim =
      Number(options.minimumClaim ?? 0);

    this.maximumPrecision =
      Number(options.maximumPrecision ?? 12);
  }

  calculate({
    elapsedMs,
    rate,
    multiplier = 1
  }) {
    if (elapsedMs <= 0) {
      return 0;
    }

    if (rate <= 0) {
      return 0;
    }

    const reward =
      (elapsedMs / 1000) *
      Number(rate) *
      Number(multiplier);

    return this.round(reward);
  }

  isClaimable(amount) {
    return Number(amount) >= this.minimumClaim;
  }

  normalize(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Invalid reward amount');
    }

    return this.round(value);
  }

  add(...amounts) {
    const total = amounts.reduce(
      (sum, amount) => {
        return sum + Number(amount);
      },
      0
    );

    return this.round(total);
  }

  subtract(balance, amount) {
    const result =
      Number(balance) - Number(amount);

    if (result < 0) {
      throw new Error('Insufficient mining reward');
    }

    return this.round(result);
  }

  round(value) {
    return Number(
      Number(value).toFixed(this.maximumPrecision)
    );
  }
}

module.exports = MiningRewards;
