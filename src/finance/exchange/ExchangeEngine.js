// 3. src/finance/exchange/ExchangeEngine.js

const Rates = require("./Rates");
const WalletManager = require("../wallet/WalletManager");

class ExchangeEngine {
  exchange(userId, fromCurrency, toCurrency, amount) {
    if (fromCurrency === toCurrency) {
      throw new Error("Source and destination currencies must differ");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid exchange amount");
    }

    const rate = Rates.getRate(fromCurrency, toCurrency);
    const outputAmount = amount * rate;

    WalletManager.debit(userId, fromCurrency, amount);

    try {
      WalletManager.credit(userId, toCurrency, outputAmount);
    } catch (error) {
      WalletManager.credit(userId, fromCurrency, amount);
      throw error;
    }

    return {
      success: true,
      userId,
      fromCurrency,
      toCurrency,
      inputAmount: amount,
      rate,
      outputAmount,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ExchangeEngine();
