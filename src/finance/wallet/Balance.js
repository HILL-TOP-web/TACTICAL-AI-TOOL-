// 2. src/finance/wallet/Balance.js

const WalletManager = require("./WalletManager");

class Balance {
  getAll(userId) {
    const wallet = WalletManager.requireWallet(userId);

    return {
      userId,
      walletId: wallet.id,
      SKD: wallet.currencies.SKD,
      USDT: wallet.currencies.USDT,
      NGN: wallet.currencies.NGN,
      updatedAt: wallet.updatedAt
    };
  }

  get(userId, currency) {
    return WalletManager.getBalance(userId, currency);
  }

  hasSufficientBalance(userId, currency, amount) {
    const balance = this.get(userId, currency);

    return balance >= amount;
  }
}

module.exports = new Balance();
