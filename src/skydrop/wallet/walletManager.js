'use strict';

const BalanceManager = require('./balanceManager');
const TransactionManager = require('./transactionManager');
const DepositManager = require('./depositManager');
const WithdrawalManager = require('./withdrawalManager');

class WalletManager {
  constructor(options = {}) {
    this.balances = new BalanceManager(options);
    this.transactions = new TransactionManager(options);

    this.deposits = new DepositManager({
      balanceManager: this.balances,
      transactionManager: this.transactions
    });

    this.withdrawals = new WithdrawalManager({
      balanceManager: this.balances,
      transactionManager: this.transactions
    });
  }

  createWallet(userId) {
    this.balances.createWallet(userId);

    return this.getWallet(userId);
  }

  getWallet(userId) {
    return {
      userId,
      balances: this.balances.getBalances(userId),
      transactions: this.transactions.getTransactions(userId)
    };
  }

  getBalances(userId) {
    return this.balances.getBalances(userId);
  }

  getBalance(userId, asset) {
    return this.balances.getBalance(userId, asset);
  }

  credit(userId, asset, amount, metadata = {}) {
    return this.balances.credit(
      userId,
      asset,
      amount,
      metadata
    );
  }

  debit(userId, asset, amount, metadata = {}) {
    return this.balances.debit(
      userId,
      asset,
      amount,
      metadata
    );
  }

  deposit(userId, asset, amount, metadata = {}) {
    return this.deposits.createDeposit(
      userId,
      asset,
      amount,
      metadata
    );
  }

  requestWithdrawal(
    userId,
    asset,
    amount,
    destination,
    metadata = {}
  ) {
    return this.withdrawals.createWithdrawal({
      userId,
      asset,
      amount,
      destination,
      metadata
    });
  }

  getTransactions(userId, filters = {}) {
    return this.transactions.getTransactions(
      userId,
      filters
    );
  }

  getTransaction(transactionId) {
    return this.transactions.getTransaction(
      transactionId
    );
  }
}

module.exports = WalletManager;
