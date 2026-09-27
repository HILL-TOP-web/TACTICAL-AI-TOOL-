// 3. src/finance/database/BalanceRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class BalanceRepository {
  constructor() {
    this.collection = "balances";
  }

  create(walletId, currency, amount = 0) {
    if (!walletId) {
      throw new Error("walletId is required");
    }

    if (!currency) {
      throw new Error("currency is required");
    }

    const existing = this.find(walletId, currency);

    if (existing) {
      return existing;
    }

    const balance = {
      id: crypto.randomUUID(),
      walletId,
      currency,
      amount: Number(amount),
      lockedAmount: 0,
      availableAmount: Number(amount),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, balance);
  }

  find(walletId, currency) {
    return Database.findOne(
      this.collection,
      balance =>
        balance.walletId === walletId &&
        balance.currency === currency
    );
  }

  findByWalletId(walletId) {
    return Database.findMany(
      this.collection,
      balance => balance.walletId === walletId
    );
  }

  updateAmount(walletId, currency, amount) {
    const balance = this.find(walletId, currency);

    if (!balance) {
      return null;
    }

    const newAmount = Number(amount);

    return Database.updateOne(
      this.collection,
      item => item.id === balance.id,
      {
        amount: newAmount,
        availableAmount: newAmount - Number(balance.lockedAmount || 0)
      }
    );
  }

  increase(walletId, currency, amount) {
    const balance = this.find(walletId, currency);

    if (!balance) {
      return this.create(walletId, currency, Number(amount));
    }

    return this.updateAmount(
      walletId,
      currency,
      Number(balance.amount) + Number(amount)
    );
  }

  decrease(walletId, currency, amount) {
    const balance = this.find(walletId, currency);

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (Number(balance.availableAmount) < Number(amount)) {
      throw new Error("Insufficient available balance");
    }

    return this.updateAmount(
      walletId,
      currency,
      Number(balance.amount) - Number(amount)
    );
  }

  lock(walletId, currency, amount) {
    const balance = this.find(walletId, currency);

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (Number(balance.availableAmount) < Number(amount)) {
      throw new Error("Insufficient available balance");
    }

    const lockedAmount =
      Number(balance.lockedAmount) + Number(amount);

    return Database.updateOne(
      this.collection,
      item => item.id === balance.id,
      {
        lockedAmount,
        availableAmount:
          Number(balance.amount) - lockedAmount
      }
    );
  }

  unlock(walletId, currency, amount) {
    const balance = this.find(walletId, currency);

    if (!balance) {
      throw new Error("Balance not found");
    }

    const lockedAmount = Math.max(
      0,
      Number(balance.lockedAmount) - Number(amount)
    );

    return Database.updateOne(
      this.collection,
      item => item.id === balance.id,
      {
        lockedAmount,
        availableAmount:
          Number(balance.amount) - lockedAmount
      }
    );
  }
}

module.exports = new BalanceRepository();
