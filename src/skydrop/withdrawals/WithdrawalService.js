'use strict';

class WithdrawalService {
  constructor({ engine, repository }) {
    if (!engine || !repository) {
      throw new Error(
        'WithdrawalService requires engine and repository.'
      );
    }

    this.engine = engine;
    this.repository = repository;
  }

  async request(userId, body) {
    return this.engine.request(userId, body);
  }

  async get(userId, withdrawalId) {
    const record = await this.repository.findById(
      withdrawalId
    );

    if (
      !record ||
      String(record.userId) !== String(userId)
    ) {
      const error = new Error('Withdrawal not found.');
      error.statusCode = 404;
      throw error;
    }

    return record;
  }

  async list(userId, limit) {
    if (!userId) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      throw error;
    }

    return this.repository.listForUser(userId, limit);
  }
}

module.exports = {
  WithdrawalService
};
