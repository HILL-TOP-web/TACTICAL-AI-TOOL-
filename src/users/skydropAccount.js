'use strict';

const crypto = require('crypto');

class SkyDropAccount {
  constructor(options = {}) {
    this.accounts = options.accounts || new Map();

    this.defaultAssets = {
      SKD: 0,
      USDT: 0
    };
  }

  /**
   * Create a SkyDrop financial account for a user.
   */
  createAccount(userId) {
    this.validateUserId(userId);

    if (this.accounts.has(userId)) {
      throw new Error(
        'SkyDrop account already exists for this user.'
      );
    }

    const now = new Date().toISOString();

    const account = {
      accountId: crypto.randomUUID(),
      userId,
      status: 'active',

      balances: {
        SKD: 0,
        USDT: 0
      },

      tradingEnabled: false,
      withdrawalsEnabled: false,

      createdAt: now,
      updatedAt: now
    };

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Validate user ID.
   */
  validateUserId(userId) {
    if (
      typeof userId !== 'string' ||
      userId.trim().length === 0
    ) {
      throw new Error('Valid user ID is required.');
    }

    return userId.trim();
  }

  /**
   * Get account.
   */
  getAccount(userId) {
    this.validateUserId(userId);

    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    return this.clone(account);
  }

  /**
   * Get SKD balance.
   */
  getSKDBalance(userId) {
    const account = this.getAccount(userId);

    return Number(account.balances.SKD || 0);
  }

  /**
   * Get USDT balance.
   */
  getUSDTBalance(userId) {
    const account = this.getAccount(userId);

    return Number(account.balances.USDT || 0);
  }

  /**
   * Set a balance.
   *
   * In production, balance mutations should normally
   * happen through a transaction/ledger service rather
   * than allowing arbitrary direct balance changes.
   */
  setBalance(userId, asset, amount) {
    const normalizedAsset =
      this.validateAsset(asset);

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        'Balance must be a non-negative number.'
      );
    }

    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    account.balances[normalizedAsset] = value;
    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Increase a balance.
   */
  credit(userId, asset, amount) {
    const normalizedAsset =
      this.validateAsset(asset);

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Credit amount must be greater than zero.'
      );
    }

    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    const current =
      Number(account.balances[normalizedAsset] || 0);

    account.balances[normalizedAsset] =
      current + value;

    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Decrease a balance.
   */
  debit(userId, asset, amount) {
    const normalizedAsset =
      this.validateAsset(asset);

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Debit amount must be greater than zero.'
      );
    }

    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    const current =
      Number(account.balances[normalizedAsset] || 0);

    if (current < value) {
      throw new Error(
        `Insufficient ${normalizedAsset} balance.`
      );
    }

    account.balances[normalizedAsset] =
      current - value;

    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Enable/disable trading for the account.
   */
  setTradingEnabled(userId, enabled) {
    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    account.tradingEnabled = Boolean(enabled);
    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Enable/disable withdrawals.
   */
  setWithdrawalsEnabled(userId, enabled) {
    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    account.withdrawalsEnabled = Boolean(enabled);
    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Freeze the account.
   */
  freeze(userId) {
    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    account.status = 'frozen';
    account.tradingEnabled = false;
    account.withdrawalsEnabled = false;
    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Reactivate account.
   */
  activate(userId) {
    const account = this.accounts.get(userId);

    if (!account) {
      throw new Error('SkyDrop account not found.');
    }

    account.status = 'active';
    account.updatedAt = new Date().toISOString();

    this.accounts.set(userId, account);

    return this.clone(account);
  }

  /**
   * Validate supported assets.
   */
  validateAsset(asset) {
    if (typeof asset !== 'string') {
      throw new Error('Asset must be a string.');
    }

    const normalized =
      asset.trim().toUpperCase();

    if (
      normalized !== 'SKD' &&
      normalized !== 'USDT'
    ) {
      throw new Error(
        `Unsupported SkyDrop asset: ${normalized}`
      );
    }

    return normalized;
  }

  /**
   * Prevent callers from modifying the internal
   * account object directly.
   */
  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
}

module.exports = SkyDropAccount;
