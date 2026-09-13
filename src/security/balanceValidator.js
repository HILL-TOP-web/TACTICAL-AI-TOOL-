'use strict';

class BalanceValidator {
  constructor(options = {}) {
    this.supportedAssets =
      options.supportedAssets || new Set([
        'SKD',
        'USDT'
      ]);
  }

  /**
   * Validate a balance value.
   */
  validateBalance(balance) {
    const value = Number(balance);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        'Balance must be a valid non-negative number.'
      );
    }

    return value;
  }

  /**
   * Validate an asset.
   */
  validateAsset(asset) {
    if (typeof asset !== 'string') {
      throw new Error(
        'Asset must be a string.'
      );
    }

    const normalized =
      asset.trim().toUpperCase();

    if (!this.supportedAssets.has(normalized)) {
      throw new Error(
        `Unsupported asset: ${normalized}`
      );
    }

    return normalized;
  }

  /**
   * Check whether a balance can cover an amount.
   */
  hasSufficientBalance(
    balance,
    amount
  ) {
    const current =
      this.validateBalance(balance);

    const required =
      Number(amount);

    if (
      !Number.isFinite(required) ||
      required <= 0
    ) {
      throw new Error(
        'Required amount must be greater than zero.'
      );
    }

    return current >= required;
  }

  /**
   * Validate a debit operation.
   */
  validateDebit(
    balance,
    amount
  ) {
    const current =
      this.validateBalance(balance);

    const debitAmount =
      Number(amount);

    if (
      !Number.isFinite(debitAmount) ||
      debitAmount <= 0
    ) {
      throw new Error(
        'Debit amount must be greater than zero.'
      );
    }

    if (current < debitAmount) {
      throw new Error(
        'Insufficient balance.'
      );
    }

    return {
      valid: true,
      currentBalance: current,
      debitAmount,
      remainingBalance:
        current - debitAmount
    };
  }

  /**
   * Validate a credit operation.
   */
  validateCredit(
    balance,
    amount
  ) {
    const current =
      this.validateBalance(balance);

    const creditAmount =
      Number(amount);

    if (
      !Number.isFinite(creditAmount) ||
      creditAmount <= 0
    ) {
      throw new Error(
        'Credit amount must be greater than zero.'
      );
    }

    return {
      valid: true,
      currentBalance: current,
      creditAmount,
      resultingBalance:
        current + creditAmount
    };
  }

  /**
   * Validate a complete balance map.
   */
  validateBalances(balances) {
    if (
      !balances ||
      typeof balances !== 'object'
    ) {
      throw new Error(
        'Balances object is required.'
      );
    }

    const validated = {};

    for (const [
      asset,
      balance
    ] of Object.entries(balances)) {
      const normalizedAsset =
        this.validateAsset(asset);

      validated[normalizedAsset] =
        this.validateBalance(balance);
    }

    return validated;
  }

  /**
   * Check that balances are not negative.
   */
  assertNoNegativeBalances(balances) {
    const validated =
      this.validateBalances(balances);

    for (const [
      asset,
      balance
    ] of Object.entries(validated)) {
      if (balance < 0) {
        throw new Error(
          `Negative ${asset} balance detected.`
        );
      }
    }

    return true;
  }
}

module.exports = new BalanceValidator();
