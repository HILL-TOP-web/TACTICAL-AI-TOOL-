'use strict';

const swapValidator = require('./swapValidator');

class SwapEngine {
  /**
   * Calculate a swap quote.
   */
  quote({
    fromAsset,
    toAsset,
    amount,
    rate
  }) {
    swapValidator.validateSwap({
      fromAsset,
      toAsset,
      amount,
      rate
    });

    const inputAmount = Number(amount);
    const exchangeRate = Number(rate);

    const outputAmount =
      inputAmount * exchangeRate;

    return {
      fromAsset: fromAsset.toUpperCase(),
      toAsset: toAsset.toUpperCase(),
      inputAmount,
      rate: exchangeRate,
      outputAmount,
      quotedAt: new Date().toISOString()
    };
  }

  /**
   * Execute a swap against an in-memory balance object.
   *
   * balances example:
   *
   * {
   *   SKD: 100,
   *   USDT: 20
   * }
   */
  execute({
    userId,
    fromAsset,
    toAsset,
    amount,
    rate,
    balances
  }) {
    swapValidator.validateUserId(userId);

    swapValidator.validateSwap({
      fromAsset,
      toAsset,
      amount,
      rate
    });

    if (
      !balances ||
      typeof balances !== 'object'
    ) {
      throw new Error(
        'A valid balance object is required.'
      );
    }

    const from = fromAsset.toUpperCase();
    const to = toAsset.toUpperCase();

    const inputAmount = Number(amount);
    const exchangeRate = Number(rate);

    const currentFromBalance =
      Number(balances[from] || 0);

    const currentToBalance =
      Number(balances[to] || 0);

    if (
      !Number.isFinite(currentFromBalance) ||
      currentFromBalance < 0
    ) {
      throw new Error(
        `Invalid ${from} balance.`
      );
    }

    if (
      !Number.isFinite(currentToBalance) ||
      currentToBalance < 0
    ) {
      throw new Error(
        `Invalid ${to} balance.`
      );
    }

    if (currentFromBalance < inputAmount) {
      throw new Error(
        `Insufficient ${from} balance.`
      );
    }

    const outputAmount =
      inputAmount * exchangeRate;

    balances[from] =
      currentFromBalance - inputAmount;

    balances[to] =
      currentToBalance + outputAmount;

    return {
      success: true,
      userId,
      fromAsset: from,
      toAsset: to,
      inputAmount,
      outputAmount,
      rate: exchangeRate,
      balances: {
        ...balances
      },
      executedAt: new Date().toISOString()
    };
  }
}

module.exports = new SwapEngine();
