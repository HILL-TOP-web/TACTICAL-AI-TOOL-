'use strict';

const tokenValidator = require('./tokenValidator');

class TokenBalance {
  /**
   * Get an address balance.
   */
  getBalance(balanceStore, address) {
    tokenValidator.validateAddress(address);

    const balance = balanceStore.get(address);

    if (balance === undefined) {
      return 0n;
    }

    return tokenValidator.parseAmount(balance);
  }

  /**
   * Set an address balance.
   */
  setBalance(balanceStore, address, amount) {
    tokenValidator.validateAddress(address);

    const value = tokenValidator.parseAmount(amount);

    if (value < 0n) {
      throw new Error('Token balance cannot be negative.');
    }

    balanceStore.set(address, value);

    return value;
  }

  /**
   * Increase balance.
   */
  increase(balanceStore, address, amount) {
    const current = this.getBalance(
      balanceStore,
      address
    );

    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error('Increase amount must be greater than zero.');
    }

    const updated = current + value;

    balanceStore.set(address, updated);

    return updated;
  }

  /**
   * Decrease balance.
   */
  decrease(balanceStore, address, amount) {
    const current = this.getBalance(
      balanceStore,
      address
    );

    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error('Decrease amount must be greater than zero.');
    }

    if (current < value) {
      throw new Error('Insufficient token balance.');
    }

    const updated = current - value;

    balanceStore.set(address, updated);

    return updated;
  }

  /**
   * Check whether an address has enough tokens.
   */
  hasEnough(balanceStore, address, amount) {
    const current = this.getBalance(
      balanceStore,
      address
    );

    const required = tokenValidator.parseAmount(amount);

    if (required < 0n) {
      return false;
    }

    return current >= required;
  }

  /**
   * Return all non-zero balances.
   */
  getAllBalances(balanceStore) {
    const result = {};

    for (const [address, balance] of balanceStore.entries()) {
      const value = tokenValidator.parseAmount(balance);

      if (value > 0n) {
        result[address] = value.toString();
      }
    }

    return result;
  }
}

module.exports = new TokenBalance();
