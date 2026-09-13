'use strict';

const tokenBalance = require('./tokenBalance');
const tokenSupply = require('./tokenSupply');
const tokenValidator = require('./tokenValidator');

class SKDToken {
  constructor(options = {}) {
    this.symbol = options.symbol || 'SKD';
    this.name = options.name || 'SkyDrop Token';
    this.decimals = Number.isInteger(options.decimals)
      ? options.decimals
      : 18;

    this.maxSupply =
      options.maxSupply !== undefined
        ? tokenValidator.parseAmount(options.maxSupply)
        : null;

    this.balances = new Map();

    this.supply = new tokenSupply({
      maxSupply: this.maxSupply
    });
  }

  /**
   * Create/mint SKD.
   */
  mint(address, amount) {
    tokenValidator.validateAddress(address);

    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error('Mint amount must be greater than zero.');
    }

    this.supply.increase(value);

    const currentBalance = this.getBalance(address);

    this.balances.set(
      address,
      currentBalance + value
    );

    return {
      type: 'MINT',
      token: this.symbol,
      address,
      amount: value.toString(),
      balance: this.getBalance(address).toString(),
      totalSupply: this.totalSupply().toString()
    };
  }

  /**
   * Burn SKD from an address.
   */
  burn(address, amount) {
    tokenValidator.validateAddress(address);

    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error('Burn amount must be greater than zero.');
    }

    const currentBalance = this.getBalance(address);

    if (currentBalance < value) {
      throw new Error('Insufficient SKD balance.');
    }

    this.balances.set(
      address,
      currentBalance - value
    );

    this.supply.decrease(value);

    return {
      type: 'BURN',
      token: this.symbol,
      address,
      amount: value.toString(),
      balance: this.getBalance(address).toString(),
      totalSupply: this.totalSupply().toString()
    };
  }

  /**
   * Transfer SKD between addresses.
   */
  transfer(from, to, amount) {
    tokenValidator.validateAddress(from);
    tokenValidator.validateAddress(to);

    if (from === to) {
      throw new Error('Sender and recipient cannot be the same.');
    }

    const value = tokenValidator.parseAmount(amount);

    if (value <= 0n) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    const senderBalance = this.getBalance(from);

    if (senderBalance < value) {
      throw new Error('Insufficient SKD balance.');
    }

    const recipientBalance = this.getBalance(to);

    this.balances.set(
      from,
      senderBalance - value
    );

    this.balances.set(
      to,
      recipientBalance + value
    );

    return {
      type: 'TRANSFER',
      token: this.symbol,
      from,
      to,
      amount: value.toString(),
      senderBalance: this.getBalance(from).toString(),
      recipientBalance: this.getBalance(to).toString()
    };
  }

  /**
   * Get address balance.
   */
  getBalance(address) {
    tokenValidator.validateAddress(address);

    return tokenBalance.getBalance(
      this.balances,
      address
    );
  }

  /**
   * Get total supply.
   */
  totalSupply() {
    return this.supply.getTotalSupply();
  }

  /**
   * Return token metadata.
   */
  getInfo() {
    return {
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      totalSupply: this.totalSupply().toString(),
      maxSupply: this.maxSupply === null
        ? null
        : this.maxSupply.toString()
    };
  }
}

module.exports = SKDToken;
