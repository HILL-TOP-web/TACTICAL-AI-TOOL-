// 5. src/finance/database/TransferRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class TransferRepository {
  constructor() {
    this.collection = "transfers";
  }

  create(data) {
    if (!data.senderUserId) {
      throw new Error("senderUserId is required");
    }

    if (!data.recipientUserId) {
      throw new Error("recipientUserId is required");
    }

    const transfer = {
      id: crypto.randomUUID(),
      reference:
        data.reference ||
        `TR-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      senderUserId: data.senderUserId,
      recipientUserId: data.recipientUserId,
      senderWalletId: data.senderWalletId || null,
      recipientWalletId: data.recipientWalletId || null,
      currency: data.currency || "SKD",
      amount: Number(data.amount || 0),
      status: data.status || "pending",
      note: data.note || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, transfer);
  }

  findById(transferId) {
    return Database.findOne(
      this.collection,
      transfer => transfer.id === transferId
    );
  }

  findByReference(reference) {
    return Database.findOne(
      this.collection,
      transfer => transfer.reference === reference
    );
  }

  findSentByUser(userId) {
    return Database.findMany(
      this.collection,
      transfer => transfer.senderUserId === userId
    );
  }

  findReceivedByUser(userId) {
    return Database.findMany(
      this.collection,
      transfer => transfer.recipientUserId === userId
    );
  }

  updateStatus(transferId, status) {
    return Database.updateOne(
      this.collection,
      transfer => transfer.id === transferId,
      {
        status
      }
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new TransferRepository();
