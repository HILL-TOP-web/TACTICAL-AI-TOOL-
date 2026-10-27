'use strict';

const DatabaseConnection = require('../database/DatabaseConnection');

class TransactionRepository {
  constructor(database = DatabaseConnection) {
    this.database = database;
    this.collectionName = 'skydrop_transactions';
  }

  async collection() {
    const db = await this.database.getDb();

    return db.collection(this.collectionName);
  }

  async findByReference(reference, options = {}) {
    const collection = await this.collection();

    return collection.findOne(
      { reference },
      { session: options.session }
    );
  }

  async findByIdempotencyKey(
    userId,
    idempotencyKey,
    options = {}
  ) {
    const collection = await this.collection();

    return collection.findOne(
      {
        userId: String(userId),
        idempotencyKey
      },
      { session: options.session }
    );
  }

  async create(transaction, options = {}) {
    const collection = await this.collection();

    const document = {
      ...transaction,
      userId: String(transaction.userId),
      createdAt: new Date(transaction.createdAt || Date.now()),
      updatedAt: new Date(),
      version: 1
    };

    await collection.insertOne(document, {
      session: options.session
    });

    return document;
  }

  async updateStatus(reference, status, options = {}) {
    const collection = await this.collection();

    if (!Number.isInteger(options.expectedVersion)) {
      throw new Error(
        'Expected transaction version is required.'
      );
    }

    const result = await collection.findOneAndUpdate(
      {
        reference,
        version: options.expectedVersion
      },
      {
        $set: {
          status,
          updatedAt: new Date()
        },
        $inc: {
          version: 1
        }
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
        session: options.session
      }
    );

    if (!result) {
      throw new Error(
        'Transaction update conflict. Reload and retry.'
      );
    }

    return result;
  }

  async listByUser(userId, options = {}) {
    const collection = await this.collection();

    const limit = Math.min(
      Math.max(Number(options.limit) || 20, 1),
      100
    );

    const offset = Math.max(
      Number(options.offset) || 0,
      0
    );

    return collection
      .find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async countByUser(userId) {
    const collection = await this.collection();

    return collection.countDocuments({
      userId: String(userId)
    });
  }
}

module.exports = TransactionRepository;
