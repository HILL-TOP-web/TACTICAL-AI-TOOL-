// 8. src/finance/database/PayoutRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class PayoutRepository {
  constructor() {
    this.collection = "payouts";
  }

  create(data) {
    if (!data.userId) {
      throw new Error("userId is required");
    }

    if (!data.amount) {
      throw new Error("amount is required");
    }

    const payout = {
      id: crypto.randomUUID(),
      reference:
        data.reference ||
        `PO-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      userId: data.userId,
      bankAccountId: data.bankAccountId || null,
      provider: data.provider || "moniepoint",
      sourceCurrency: data.sourceCurrency || "USD",
      targetCurrency: data.targetCurrency || "NGN",
      sourceAmount: Number(data.sourceAmount || data.amount),
      exchangeRate: Number(data.exchangeRate || 0),
      targetAmount: Number(data.targetAmount || data.amount),
      fee: Number(data.fee || 0),
      status: data.status || "pending",
      providerReference: data.providerReference || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, payout);
  }

  findById(payoutId) {
    return Database.findOne(
      this.collection,
      payout => payout.id === payoutId
    );
  }

  findByReference(reference) {
    return Database.findOne(
      this.collection,
      payout => payout.reference === reference
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      payout => payout.userId === userId
    );
  }

  update(payoutId, updates) {
    return Database.updateOne(
      this.collection,
      payout => payout.id === payoutId,
      updates
    );
  }

  updateStatus(payoutId, status, extra = {}) {
    return this.update(payoutId, {
      status,
      ...extra
    });
  }

  markProcessing(payoutId) {
    return this.updateStatus(
      payoutId,
      "processing"
    );
  }

  markCompleted(payoutId, providerReference = null) {
    return this.updateStatus(
      payoutId,
      "completed",
      {
        providerReference
      }
    );
  }

  markFailed(payoutId, reason) {
    return this.updateStatus(
      payoutId,
      "failed",
      {
        failureReason: reason
      }
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new PayoutRepository();
