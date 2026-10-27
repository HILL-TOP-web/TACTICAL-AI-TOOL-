'use strict';

const { getDatabaseConnection } = require('../database/DatabaseConnection');
const LedgerValidator = require('../ledger/LedgerValidator');

class WalletManager {
  constructor(database = getDatabaseConnection()) {
    this.database = database;
  }

  async collection() {
    return this.database.collection('wallets');
  }

  async ensureWallet({
    userId,
    currency = 'NGN',
    session
  }) {
    LedgerValidator.validateUserId(userId);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const collection = await this.collection();

    await collection.updateOne(
      {
        userId,
        currency: normalizedCurrency
      },
      {
        $setOnInsert: {
          userId,
          currency: normalizedCurrency,
          balanceMinor: 0,
          status: 'ACTIVE',
          createdAt: new Date()
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        session
      }
    );

    return collection.findOne(
      {
        userId,
        currency: normalizedCurrency
      },
      { session }
    );
  }

  async debit({
    userId,
    currency = 'NGN',
    amountMinor,
    session
  }) {
    LedgerValidator.validateUserId(userId);

    LedgerValidator.validateAmountMinor(amountMinor);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const collection = await this.collection();

    const result = await collection.updateOne(
      {
        userId,
        currency: normalizedCurrency,
        status: 'ACTIVE',
        balanceMinor: { $gte: amountMinor }
      },
      {
        $inc: {
          balanceMinor: -amountMinor
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(
        'Insufficient funds or wallet is unavailable.'
      );
    }

    return collection.findOne(
      {
        userId,
        currency: normalizedCurrency
      },
      { session }
    );
  }

  async credit({
    userId,
    currency = 'NGN',
    amountMinor,
    session
  }) {
    LedgerValidator.validateUserId(userId);

    LedgerValidator.validateAmountMinor(amountMinor);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const collection = await this.collection();

    const result = await collection.updateOne(
      {
        userId,
        currency: normalizedCurrency,
        status: 'ACTIVE'
      },
      {
        $inc: {
          balanceMinor: amountMinor
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(
        'Recipient wallet is unavailable.'
      );
    }

    return collection.findOne(
      {
        userId,
        currency: normalizedCurrency
      },
      { session }
    );
  }

  async getWallet({
    userId,
    currency = 'NGN'
  }) {
    LedgerValidator.validateUserId(userId);

    const normalizedCurrency =
      LedgerValidator.validateCurrency(currency);

    const collection = await this.collection();

    return collection.findOne({
      userId,
      currency: normalizedCurrency
    });
  }
}

module.exports = WalletManager;
