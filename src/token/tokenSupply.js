'use strict';

const tokenValidator = require('./tokenValidator');

class TokenSupply {
  constructor(options = {}) {
    this.total = 0n;

    this.maxSupply =
      options.maxSupply !== undefined &&
      options.maxSupply !== null
        ? tokenValidator.parseAmount(options.maxSupply)
        : null;

    if (
      this.maxSupply !== null &&
      this.maxSupply < 0n
    ) {
      throw new Error('Maximum supply cannot be negative.');
    }
  }

  /**
   * Increase total token supply.
   */
  increase(amount) {
    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error(
        'Supply increase must be greater than zero.'
      );
    }

    const newSupply = this.total + value;

    if (
      this.maxSupply !== null &&
      newSupply > this.maxSupply
    ) {
      throw new Error(
        'Maximum SKD supply would be exceeded.'
      );
    }

    this.total = newSupply;

    return this.total;
  }

  /**
   * Decrease total token supply.
   */
  decrease(amount) {
    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error(
        'Supply decrease must be greater than zero.'
      );
    }

    if (this.total < value) {
      throw new Error(
        'Cannot burn more SKD than total supply.'
      );
    }

    this.total -= value;

    return this.total;
  }

  /**
   * Get current total supply.
   */
  getTotalSupply() {
    return this.total;
  }

  /**
   * Get maximum supply.
   */
  getMaxSupply() {
    return this.maxSupply;
  }

  /**
   * Get remaining mintable supply.
   */
  getRemainingSupply() {
    if (this.maxSupply === null) {
      return null;
    }

    return this.maxSupply - this.total;
  }

  /**
   * Check whether more tokens can be minted.
   */
  canMint(amount) {
    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      return false;
    }

    if (this.maxSupply === null) {
      return true;
    }

    return this.total + value <= this.maxSupply;
  }

  /**
   * Return supply information.
   */
  getInfo() {
    return {
      totalSupply: this.total.toString(),
      maxSupply:
        this.maxSupply === null
          ? null
          : this.maxSupply.toString(),
      remainingSupply:
        this.getRemainingSupply() === null
          ? null
          : this.getRemainingSupply().toString()
    };
  }
}

module.exports = TokenSupply;
