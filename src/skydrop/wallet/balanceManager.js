'use strict';

const crypto = require('crypto');

class BalanceManager {
  constructor(options = {}) {
    this.assets = options.assets || ['SKD', 'USDT'];

    this.wallets = new Map();

    this.allowNegative =
      options.allowNegative === true;
  }

  createWallet(userId) {
    this.validateUserId(userId);

    if (this.wallets.has(userId)) {
      return this.wallets.get(userId);
    }

    const balances = {};

    for (const asset of this.assets) {
      balances[asset] = 0;
    }

    const wallet = {
      walletId: crypto.randomUUID(),
      userId,
      balances,
      createdAt: new Date().toISOString()
    };

    this.wallets.set(userId, wallet);

    return wallet;
  }

  getWallet(userId) {
    this.validateUserId(userId);

    if (!this.wallets.has(userId)) {
      return this.createWallet(userId);
    }

    return this.wallets.get(userId);
  }

  getBalances(userId) {
    const wallet = this.getWallet(userId);

    return {
      ...wallet.balances
    };
  }

  getBalance(userId, asset) {
    this.validateAsset(asset);

    const wallet = this.getWallet(userId);

    return wallet.balances[asset];
  }

  credit(
    userId,
    asset,
    amount,
    metadata = {}
  ) {
    this.validateUserId(userId);
    this.validateAsset(asset);
    this.validateAmount(amount);

    const wallet = this.getWallet(userId);

    wallet.balances[asset] += Number(amount);

    return {
      walletId: wallet.walletId,
      userId,
      asset,
      amount: Number(amount),
      balance: wallet.balances[asset],
      metadata,
      updatedAt: new Date().toISOString()
    };
  }

  debit(
    userId,
    asset,
    amount,
    metadata = {}
  ) {
    this.validateUserId(userId);
    this.validateAsset(asset);
    this.validateAmount(amount);

    const wallet = this.getWallet(userId);

    const currentBalance =
      wallet.balances[asset];

    if (
      !this.allowNegative &&
      currentBalance < Number(amount)
    ) {
      throw new Error(
        `Insufficient ${asset} balance`
      );
    }

    wallet.balances[asset] -= Number(amount);

    return {
      walletId: wallet.walletId,
      userId,
      asset,
      amount: Number(amount),
      balance: wallet.balances[asset],
      metadata,
      updatedAt: new Date().toISOString()
    };
  }

  hasSufficientBalance(
    userId,
    asset,
    amount
  ) {
    this.validateAsset(asset);
    this.validateAmount(amount);

    return (
      this.getBalance(userId, asset) >=
      Number(amount)
    );
  }

  validateUserId(userId) {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ''
    ) {
      throw new Error(
        'A valid userId is required'
      );
    }
  }

  validateAsset(asset) {
    if (!this.assets.includes(asset)) {
      throw new Error(
        `Unsupported wallet asset: ${asset}`
      );
    }
  }

  validateAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(
        'Amount must be greater than zero'
      );
    }
  }
}

module.exports = BalanceManager;
