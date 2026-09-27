// src/finance/banking/BankAccounts.js

const crypto = require("crypto");

class BankAccounts {
  constructor() {
    this.accounts = new Map();
  }

  addAccount({
    userId,
    accountNumber,
    bankCode,
    accountName
  }) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!accountNumber || !bankCode) {
      throw new Error(
        "Account number and bank code are required"
      );
    }

    const account = {
      id: crypto.randomUUID(),
      userId,
      accountNumber,
      bankCode,
      accountName: accountName || null,
      provider: "moniepoint",
      verified: false,
      createdAt: new Date().toISOString()
    };

    if (!this.accounts.has(userId)) {
      this.accounts.set(userId, []);
    }

    this.accounts.get(userId).push(account);

    return account;
  }

  getAccounts(userId) {
    return this.accounts.get(userId) || [];
  }

  getAccount(userId, accountId) {
    const accounts = this.getAccounts(userId);

    return (
      accounts.find(
        account => account.id === accountId
      ) || null
    );
  }

  markVerified(userId, accountId) {
    const account = this.getAccount(
      userId,
      accountId
    );

    if (!account) {
      throw new Error("Bank account not found");
    }

    account.verified = true;

    return account;
  }

  removeAccount(userId, accountId) {
    const accounts = this.getAccounts(userId);

    const filtered = accounts.filter(
      account => account.id !== accountId
    );

    this.accounts.set(userId, filtered);

    return true;
  }
}

module.exports = new BankAccounts();
