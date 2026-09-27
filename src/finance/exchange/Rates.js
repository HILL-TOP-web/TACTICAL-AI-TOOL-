// src/finance/exchange/Rates.js

const conversionConfig = require("../conversion/conversionConfig");

class Rates {
  constructor() {
    this.rates = {
      SKD_USDT: 200000000,
      USD_NGN: 2000,
      USDT_NGN: 2000
    };
  }

  getRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const directKey = `${fromCurrency}_${toCurrency}`;

    if (this.rates[directKey]) {
      return this.rates[directKey];
    }

    const reverseKey = `${toCurrency}_${fromCurrency}`;

    if (this.rates[reverseKey]) {
      return 1 / this.rates[reverseKey];
    }

    if (
      fromCurrency === "SKD" &&
      toCurrency === "NGN"
    ) {
      return (
        this.rates.SKD_USDT *
        this.rates.USDT_NGN
      );
    }

    if (
      fromCurrency === "NGN" &&
      toCurrency === "SKD"
    ) {
      return 1 / (
        this.rates.SKD_USDT *
        this.rates.USDT_NGN
      );
    }

    throw new Error(
      `Exchange rate unavailable: ${fromCurrency}/${toCurrency}`
    );
  }

  setRate(fromCurrency, toCurrency, rate) {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid exchange rate");
    }

    this.rates[`${fromCurrency}_${toCurrency}`] = rate;
  }

  getAllRates() {
    return {
      ...this.rates,
      SKD_USD:
        conversionConfig?.SKD_PRICE_USD ||
        200000000
    };
  }
}

module.exports = new Rates();
