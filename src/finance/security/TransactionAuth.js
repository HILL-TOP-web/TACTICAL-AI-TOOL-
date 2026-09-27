// 11. src/finance/security/TransactionAuth.js

const crypto = require("crypto");

class TransactionAuth {
  constructor() {
    this.tokens = new Map();
  }

  createToken(userId) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const token = crypto.randomBytes(32).toString("hex");

    this.tokens.set(token, {
      userId,
      expiresAt:
        Date.now() +
        5 * 60 * 1000
    });

    return token;
  }

  verifyToken(userId, token) {
    const record = this.tokens.get(token);

    if (!record) {
      return false;
    }

    if (record.userId !== userId) {
      return false;
    }

    if (Date.now() > record.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  consumeToken(userId, token) {
    if (!this.verifyToken(userId, token)) {
      throw new Error(
        "Invalid or expired transaction authorization"
      );
    }

    this.tokens.delete(token);

    return true;
  }
}

module.exports = new TransactionAuth();
