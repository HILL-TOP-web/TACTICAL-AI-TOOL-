// src/finance/transfers/TransferEngine.js

const crypto = require("crypto");
const WalletManager = require("../wallet/WalletManager");
const TransactionHistory = require("./TransactionHistory");

class TransferEngine {
  send(senderId, recipientId, currency, amount) {
    if (!senderId || !recipientId) {
      throw new Error("Sender and recipient are required");
    }

    if (senderId === recipientId) {
      throw new Error("Cannot transfer to yourself");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Transfer amount must be greater than zero");
    }

    const transactionId = crypto.randomUUID();

    WalletManager.transfer(
      senderId,
      recipientId,
      currency,
      amount
    );

    const transaction = {
      id: transactionId,
      type: "wallet_transfer",
      senderId,
      recipientId,
      currency,
      amount,
      status: "completed",
      createdAt: new Date().toISOString()
    };

    TransactionHistory.add(transaction);

    return transaction;
  }
}

module.exports = new TransferEngine();
