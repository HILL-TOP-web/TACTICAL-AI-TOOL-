// 1. src/finance/wallet/WalletManager.js

const crypto = require("crypto");

class WalletManager {
  constructor() {
    this.wallets = new Map();
  }

  createWallet(userId) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (this.wallets.has(userId)) {
      return this.wallets.get(userId);
    }

    const wallet = {
      id: crypto.randomUUID(),
      userId,
      currencies: {
        SKD: 0,
        USDT: 0,
        NGN: 0
      },
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.wallets.set(userId, wallet);

    return wallet;
  }

  getWallet(userId) {
    return this.wallets.get(userId) || null;
  }

  requireWallet(userId) {
    const wallet = this.getWallet(userId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return wallet;
  }

  getBalance(userId, currency) {
    const wallet = this.requireWallet(userId);

    if (!(currency in wallet.currencies)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return wallet.currencies[currency];
  }

  credit(userId, currency, amount) {
    const wallet = this.requireWallet(userId);

    this.validateAmount(amount);

    if (!(currency in wallet.currencies)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    wallet.currencies[currency] += amount;
    wallet.updatedAt = new Date().toISOString();

    return wallet;
  }

  debit(userId, currency, amount) {
    const wallet = this.requireWallet(userId);

    this.validateAmount(amount);

    if (!(currency in wallet.currencies)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    if (wallet.currencies[currency] < amount) {
      throw new Error("Insufficient balance");
    }

    wallet.currencies[currency] -= amount;
    wallet.updatedAt = new Date().toISOString();

    return wallet;
  }

  transfer(userId, recipientId, currency, amount) {
    if (userId === recipientId) {
      throw new Error("Cannot transfer to the same wallet");
    }

    this.validateAmount(amount);

    this.debit(userId, currency, amount);

    try {
      this.credit(recipientId, currency, amount);
    } catch (error) {
      this.credit(userId, currency, amount);
      throw error;
    }

    return {
      success: true,
      from: userId,
      to: recipientId,
      currency,
      amount
    };
  }

  validateAmount(amount) {
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error("Amount must be greater than zero");
    }
  }
}

module.exports = new WalletManager();
