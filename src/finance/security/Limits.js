// src/finance/security/Limits.js

class Limits {
  constructor() {
    this.defaultLimits = {
      SKD: {
        daily: 1000000,
        single: 1000000
      },

      USDT: {
        daily: 100000,
        single: 50000
      },

      NGN: {
        daily: 1000000000,
        single: 100000000
      }
    };

    this.userUsage = new Map();
  }

  getLimit(currency) {
    const limit = this.defaultLimits[currency];

    if (!limit) {
      throw new Error(
        `No limits configured for ${currency}`
      );
    }

    return limit;
  }

  checkSingle(currency, amount) {
    const limit = this.getLimit(currency);

    if (amount > limit.single) {
      throw new Error(
        `Amount exceeds single transaction limit of ${limit.single} ${currency}`
      );
    }

    return true;
  }

  checkDaily(userId, currency, amount) {
    const limit = this.getLimit(currency);

    const key = `${userId}:${currency}`;

    const current = this.userUsage.get(key) || 0;

    if (current + amount > limit.daily) {
      throw new Error(
        `Daily ${currency} transaction limit exceeded`
      );
    }

    return true;
  }

  record(userId, currency, amount) {
    const key = `${userId}:${currency}`;

    const current = this.userUsage.get(key) || 0;

    this.userUsage.set(
      key,
      current + amount
    );

    return this.userUsage.get(key);
  }

  validate(userId, currency, amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }

    this.checkSingle(currency, amount);
    this.checkDaily(userId, currency, amount);

    return true;
  }
}

module.exports = new Limits();
