'use strict';

const crypto = require('node:crypto');

const TransactionRepository = require('./TransactionRepository');
const TransactionValidator = require('./TransactionValidator');
const TransactionStatus = require('./TransactionStatus');

class TransactionService {
  constructor({
    repository = new TransactionRepository(),
    validator = new TransactionValidator()
  } = {}) {
    this.repository = repository;
    this.validator = validator;
  }

  async create(input, actor, options = {}) {
    this.validator.validateCreate(input);

    if (!actor || !actor.userId) {
      throw new Error('Authentication is required.');
    }

    const session = options.session;

    const existing =
      await this.repository.findByIdempotencyKey(
        actor.userId,
        input.idempotencyKey,
        { session }
      );

    if (existing) {
      return existing;
    }

    const transaction = {
      reference: crypto.randomUUID(),
      idempotencyKey: input.idempotencyKey,
      userId: String(actor.userId),
      type: input.type,
      amountMinor: input.amountMinor,
      currency: input.currency,
      status: TransactionStatus.PENDING,
      description: input.description || '',
      metadata: input.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    try {
      return await this.repository.create(transaction, {
        session
      });
    } catch (error) {
      // A concurrent request may have inserted the same key.
      if (error.code === 11000) {
        const duplicate =
          await this.repository.findByIdempotencyKey(
            actor.userId,
            input.idempotencyKey,
            { session }
          );

        if (duplicate) {
          return duplicate;
        }
      }

      throw error;
    }
  }

  async getByReference(reference, actor) {
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

  async updateStatus(reference, nextStatus, actor, options = {}) {
    if (!actor || !actor.userId) {
      throw new Error('Authentication is required.');
    }

    if (actor.role !== 'admin' && !actor.canUpdateTransactionStatus) {
      throw new Error('Permission denied.');
    }

    if (!TransactionStatus.isValid(nextStatus)) {
      throw new Error('Invalid transaction status.');
    }

    const transaction =
      await this.repository.findByReference(reference, options);

    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    TransactionStatus.assertTransition(
      transaction.status,
      nextStatus
    );

    return this.repository.updateStatus(
      reference,
      nextStatus,
      {
        ...options,
        expectedVersion: transaction.version
      }
    );
  }
}

module.exports = TransactionService;
