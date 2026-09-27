// 2. src/finance/database/WalletRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class WalletRepository {
  constructor() {
    this.collection = "wallets";
  }

  create(userId) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const existing = this.findByUserId(userId);

    if (existing) {
      return existing;
    }

    const wallet = {
      id: crypto.randomUUID(),
      userId,
      currencies: ["SKD", "USDT"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, wallet);
  }

  findById(walletId) {
    return Database.findOne(
      this.collection,
      wallet => wallet.id === walletId
    );
  }

  findByUserId(userId) {
    return Database.findOne(
      this.collection,
      wallet => wallet.userId === userId
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }

  update(walletId, updates) {
    return Database.updateOne(
      this.collection,
      wallet => wallet.id === walletId,
      updates
    );
  }

  deactivate(walletId) {
    return this.update(walletId, {
      status: "inactive"
    });
  }

  activate(walletId) {
    return this.update(walletId, {
      status: "active"
    });
  }
}

module.exports = new WalletRepository();
