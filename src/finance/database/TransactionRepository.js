// 4. src/finance/database/TransactionRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class TransactionRepository {
  constructor() {
    this.collection = "transactions";
  }

  create(data) {
    if (!data.userId) {
      throw new Error("userId is required");
    }

    const transaction = {
      id: crypto.randomUUID(),
      reference:
        data.reference ||
        `TX-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      userId: data.userId,
      walletId: data.walletId || null,
      type: data.type || "unknown",
      currency: data.currency || null,
      amount: Number(data.amount || 0),
      status: data.status || "pending",
      description: data.description || "",
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, transaction);
  }

  findById(transactionId) {
    return Database.findOne(
      this.collection,
      transaction => transaction.id === transactionId
    );
  }

  findByReference(reference) {
    return Database.findOne(
      this.collection,
      transaction => transaction.reference === reference
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      transaction => transaction.userId === userId
    );
  }

  findByWalletId(walletId) {
    return Database.findMany(
      this.collection,
      transaction => transaction.walletId === walletId
    );
  }

  updateStatus(transactionId, status) {
    return Database.updateOne(
      this.collection,
      transaction => transaction.id === transactionId,
      {
        status
      }
    );
  }

  update(transactionId, updates) {
    return Database.updateOne(
      this.collection,
      transaction => transaction.id === transactionId,
      updates
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new TransactionRepository();
