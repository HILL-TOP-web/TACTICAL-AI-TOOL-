'use strict';

const { getDatabaseConnection } = require('../database/DatabaseConnection');
const LedgerRepository = require('../ledger/LedgerRepository');
const LedgerValidator = require('../ledger/LedgerValidator');

class BalanceService {
  constructor({
    database = getDatabaseConnection(),
    ledgerRepository = new LedgerRepository(database)
  } = {}) {
    this.database = database;
    this.ledgerRepository = ledgerRepository;
  }

  async getBalance({
    userId,
    currency = 'NGN'
  }) {
    LedgerValidator.validateUserId(userId);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const db = await this.database.connect();

    const wallet = await db.collection('wallets').findOne({
      userId,
      currency: normalizedCurrency
    });

    if (!wallet) {
      return {
        userId,
        currency: normalizedCurrency,
        balanceMinor: 0,
        balance: 0
      };
    }

    return {
      userId,
      currency: normalizedCurrency,
      balanceMinor: wallet.balanceMinor,
      balance: wallet.balanceMinor / 100
    };
  }

  async getLedgerBalance({
    userId,
    currency = 'NGN'
  }) {
    LedgerValidator.validateUserId(userId);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const result = await this.ledgerRepository.sumForUser({
      userId,
      currency: normalizedCurrency
    });

    return {
      userId,
      currency: normalizedCurrency,
      balanceMinor: result.balanceMinor,
      balance: result.balanceMinor / 100
    };
  }

  async reconcile({
    userId,
    currency = 'NGN'
  }) {
    const walletBalance = await this.getBalance({
      userId,
      currency
    });

    const ledgerBalance = await this.getLedgerBalance({
      userId,
      currency
    });

    return {
      userId,
      currency: walletBalance.currency,
      walletBalanceMinor: walletBalance.balanceMinor,
      ledgerBalanceMinor: ledgerBalance.balanceMinor,
      matches:
        walletBalance.balanceMinor ===
        ledgerBalance.balanceMinor
    };
  }
}

module.exports = BalanceService;
