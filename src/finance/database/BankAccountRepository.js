// 6. src/finance/database/BankAccountRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class BankAccountRepository {
  constructor() {
    this.collection = "bankAccounts";
  }

  create(data) {
    if (!data.userId) {
      throw new Error("userId is required");
    }

    if (!data.accountNumber) {
      throw new Error("accountNumber is required");
    }

    const account = {
      id: crypto.randomUUID(),
      userId: data.userId,
      provider: data.provider || "moniepoint",
      bankName: data.bankName || "",
      accountName: data.accountName || "",
      accountNumber: data.accountNumber,
      bankCode: data.bankCode || "",
      status: data.status || "pending",
      isPrimary: Boolean(data.isPrimary),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, account);
  }

  findById(accountId) {
    return Database.findOne(
      this.collection,
      account => account.id === accountId
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      account => account.userId === userId
    );
  }

  findPrimary(userId) {
    return Database.findOne(
      this.collection,
      account =>
        account.userId === userId &&
        account.isPrimary === true
    );
  }

  update(accountId, updates) {
    return Database.updateOne(
      this.collection,
      account => account.id === accountId,
      updates
    );
  }

  verify(accountId) {
    return this.update(accountId, {
      status: "verified"
    });
  }

  setPrimary(accountId) {
    const account = this.findById(accountId);

    if (!account) {
      return null;
    }

    const userAccounts = this.findByUserId(account.userId);

    for (const item of userAccounts) {
      Database.updateOne(
        this.collection,
        current => current.id === item.id,
        {
          isPrimary: item.id === accountId
        }
      );
    }

    return this.findById(accountId);
  }

  remove(accountId) {
    return Database.deleteOne(
      this.collection,
      account => account.id === accountId
    );
  }
}

module.exports = new BankAccountRepository();
