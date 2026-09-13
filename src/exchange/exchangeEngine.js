'use strict';

const rateProvider = require('./rateProvider');
const swapEngine = require('./swapEngine');
const swapValidator = require('./swapValidator');
const tradingRules = require('./tradingRules');

class ExchangeEngine {
  constructor(options = {}) {
    this.rateProvider = options.rateProvider || rateProvider;
    this.swapEngine = options.swapEngine || swapEngine;
    this.tradingRules = options.tradingRules || tradingRules;
  }

  /**
   * Get the current SKD/USDT market rate.
   */
  getRate() {
    return this.rateProvider.getRate('SKD', 'USDT');
  }

  /**
   * Check whether trading is currently allowed.
   */
  getTradingStatus(now = new Date()) {
    return this.tradingRules.getTradingStatus(now);
  }

  /**
   * Quote an SKD -> USDT swap.
   */
  quoteSKDToUSDT(amount) {
    swapValidator.validateAmount(amount);

    const status = this.getTradingStatus();

    if (!status.enabled) {
      throw new Error(status.reason);
    }

    const rate = this.rateProvider.getRate('SKD', 'USDT');

    return this.swapEngine.quote({
      fromAsset: 'SKD',
      toAsset: 'USDT',
      amount,
      rate
    });
  }

  /**
   * Execute an SKD -> USDT swap.
   */
  executeSKDToUSDT({
    userId,
    amount,
    balances
  }) {
    swapValidator.validateUserId(userId);
    swapValidator.validateAmount(amount);

    const status = this.getTradingStatus();

    if (!status.enabled) {
      throw new Error(status.reason);
    }

    const rate = this.rateProvider.getRate('SKD', 'USDT');

    return this.swapEngine.execute({
      userId,
      fromAsset: 'SKD',
      toAsset: 'USDT',
      amount,
      rate,
      balances
    });
  }

  /**
   * Return exchange information.
   */
  getInfo() {
    return {
      trading: this.getTradingStatus(),
      rate: this.getRate(),
      supportedPairs: [
        'SKD/USDT'
      ]
    };
  }
}

module.exports = ExchangeEngine;
