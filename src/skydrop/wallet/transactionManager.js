'use strict';

const crypto = require('crypto');

class TransactionManager {
  constructor() {
    this.transactions = new Map();
  }

  createTransaction(data = {}) {
    const transaction = {
      id: crypto.randomUUID(),

      userId: data.userId,
      type: data.type || 'unknown',

      asset: data.asset,
      amount: Number(data.amount || 0),

      status: data.status || 'pending',

      source: data.source || null,
      destination: data.destination || null,

      metadata: data.metadata || {},

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };

    this.transactions.set(
      transaction.id,
      transaction
    );

    return {
      ...transaction
    };
  }

  updateStatus(
    transactionId,
    status,
    metadata = {}
  ) {
    const transaction =
      this.getTransaction(transactionId);

    transaction.status = status;

    transaction.metadata = {
      ...transaction.metadata,
      ...metadata
    };

    transaction.updatedAt =
      new Date().toISOString();

    return {
      ...transaction
    };
  }

  getTransaction(transactionId) {
    const transaction =
      this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(
        'Transaction not found'
      );
    }

    return {
      ...transaction
    };
  }

  getTransactions(
    userId,
    filters = {}
  ) {
    const results = [];

    for (const transaction of this.transactions.values()) {
      if (
        String(transaction.userId) !==
        String(userId)
      ) {
        continue;
      }

      if (
        filters.type &&
        transaction.type !== filters.type
      ) {
        continue;
      }

      if (
        filters.asset &&
        transaction.asset !== filters.asset
      ) {
        continue;
      }

      if (
        filters.status &&
        transaction.status !== filters.status
      ) {
        continue;
      }

      results.push({
        ...transaction
      });
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  getAllTransactions() {
    return Array.from(
      this.transactions.values()
    ).map(transaction => ({
      ...transaction
    }));
  }
}

module.exports = TransactionManager;
