// src/finance/transfers/TransactionHistory.js

class TransactionHistory {
  constructor() {
    this.transactions = [];
  }

  add(transaction) {
    if (!transaction || !transaction.id) {
      throw new Error("Invalid transaction");
    }

    this.transactions.push(transaction);

    return transaction;
  }

  getById(transactionId) {
    return (
      this.transactions.find(
        transaction => transaction.id === transactionId
      ) || null
    );
  }

  getForUser(userId) {
    return this.transactions.filter(
      transaction =>
        transaction.senderId === userId ||
        transaction.recipientId === userId ||
        transaction.userId === userId
    );
  }

  getAll(limit = 100) {
    return this.transactions
      .slice(-limit)
      .reverse();
  }
}

module.exports = new TransactionHistory();
