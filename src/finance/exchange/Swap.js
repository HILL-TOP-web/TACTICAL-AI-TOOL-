// src/finance/exchange/Swap.js

const ExchangeEngine = require("./ExchangeEngine");

class Swap {
  execute(userId, fromCurrency, toCurrency, amount) {
    return ExchangeEngine.exchange(
      userId,
      fromCurrency,
      toCurrency,
      amount
    );
  }

  preview(fromCurrency, toCurrency, amount, Rates) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const rate = Rates.getRate(
      fromCurrency,
      toCurrency
    );

    return {
      fromCurrency,
      toCurrency,
      amount,
      rate,
      estimatedOutput: amount * rate
    };
  }
}

module.exports = new Swap();
