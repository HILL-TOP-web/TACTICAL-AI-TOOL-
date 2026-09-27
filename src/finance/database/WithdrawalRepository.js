// 7. src/finance/database/WithdrawalRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class WithdrawalRepository {
  constructor() {
    this.collection = "withdrawals";
  }

  create(data) {
    if (!data.userId) {
      throw new Error("userId is required");
    }

    if (!data.amount) {
      throw new Error("amount is required");
    }

    const withdrawal = {
      id: crypto.randomUUID(),
      reference:
        data.reference ||
        `WD-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      userId: data.userId,
      walletId: data.walletId || null,
      bankAccountId: data.bankAccountId || null,
      provider: data.provider || "moniepoint",
      currency: data.currency || "NGN",
      amount: Number(data.amount),
      fee: Number(data.fee || 0),
      netAmount:
        Number(data.amount) - Number(data.fee || 0),
      status: data.status || "pending",
      providerReference: data.providerReference || null,
      failureReason: data.failureReason || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, withdrawal);
  }

  findById(withdrawalId) {
    return Database.findOne(
      this.collection,
      withdrawal => withdrawal.id === withdrawalId
    );
  }

  findByReference(reference) {
    return Database.findOne(
      this.collection,
      withdrawal => withdrawal.reference === reference
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      withdrawal => withdrawal.userId === userId
    );
  }

  updateStatus(withdrawalId, status, extra = {}) {
    return Database.updateOne(
      this.collection,
      withdrawal => withdrawal.id === withdrawalId,
      {
        status,
        ...extra
      }
    );
  }

  markProcessing(withdrawalId) {
    return this.updateStatus(
      withdrawalId,
      "processing"
    );
  }

  markCompleted(withdrawalId, providerReference = null) {
    return this.updateStatus(
      withdrawalId,
      "completed",
      {
        providerReference
      }
    );
  }

  markFailed(withdrawalId, failureReason) {
    return this.updateStatus(
      withdrawalId,
      "failed",
      {
        failureReason
      }
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new WithdrawalRepository();
