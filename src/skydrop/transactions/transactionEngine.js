'use strict';

const TransactionService = require('./TransactionService');
const TransactionRepository = require('./TransactionRepository');
const DatabaseConnection = require('../database/DatabaseConnection');

class TransactionEngine {
  constructor({
    transactionService = new TransactionService(),
    transactionRepository = new TransactionRepository(),
    database = DatabaseConnection
  } = {}) {
    this.transactionService = transactionService;
    this.transactionRepository = transactionRepository;
    this.database = database;
  }

  async execute(input, actor) {
    if (!actor || !actor.userId) {
      throw new Error('Authentication is required.');
    }

    return this.database.withTransaction(async (session) => {
      return this.transactionService.create(
        input,
        actor,
        { session }
      );
    });
  }

  async getByReference(reference, actor) {
    if (!actor || !actor.userId) {
      throw new Error('Authentication is required.');
    }

    const transaction =
      await this.transactionRepository.findByReference(reference);

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

module.exports = TransactionEngine;
