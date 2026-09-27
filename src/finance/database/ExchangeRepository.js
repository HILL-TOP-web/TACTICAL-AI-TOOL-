// 9. src/finance/database/ExchangeRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class ExchangeRepository {
  constructor() {
    this.collection = "exchanges";
  }

  create(data) {
    if (!data.userId) {
      throw new Error("userId is required");
    }

    if (!data.fromCurrency) {
      throw new Error("fromCurrency is required");
    }

    if (!data.toCurrency) {
      throw new Error("toCurrency is required");
    }

    const exchange = {
      id: crypto.randomUUID(),
      reference:
        data.reference ||
        `EX-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      userId: data.userId,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmount: Number(data.fromAmount || 0),
      toAmount: Number(data.toAmount || 0),
      rate: Number(data.rate || 0),
      fee: Number(data.fee || 0),
      status: data.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, exchange);
  }

  findById(exchangeId) {
    return Database.findOne(
      this.collection,
      exchange => exchange.id === exchangeId
    );
  }

  findByReference(reference) {
    return Database.findOne(
      this.collection,
      exchange => exchange.reference === reference
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      exchange => exchange.userId === userId
    );
  }

  updateStatus(exchangeId, status) {
    return Database.updateOne(
      this.collection,
      exchange => exchange.id === exchangeId,
      {
        status
      }
    );
  }

  complete(exchangeId) {
    return this.updateStatus(
      exchangeId,
      "completed"
    );
  }

  fail(exchangeId) {
    return this.updateStatus(
      exchangeId,
      "failed"
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new ExchangeRepository();
