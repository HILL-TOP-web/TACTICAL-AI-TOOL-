'use strict';

const TransactionRepository = require('./TransactionRepository');

class TransactionHistory {
  constructor({
    repository = new TransactionRepository()
  } = {}) {
    this.repository = repository;
  }

  async getUserHistory(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const limit = Math.min(
      Math.max(Number(options.limit) || 20, 1),
      100
    );

    const offset = Math.max(
      Number(options.offset) || 0,
      0
    );

    return this.repository.listByUser(userId, {
      limit,
      offset
    });
  }

  async getTransaction(reference, actor) {
    if (!actor || !actor.userId) {
      throw new Error('Authentication is required.');
    }

    const transaction =
      await this.repository.findByReference(reference);

    if (!transaction) {
      return null;
    }

    if (
      actor.role !== 'admin' &&
      String(transaction.userId) !== String(actor.userId)
    ) {
      throw new Error('Access denied.');
    }

    return transaction;
  }
}

module.exports = TransactionHistory;
