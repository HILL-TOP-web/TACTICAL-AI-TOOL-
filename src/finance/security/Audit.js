// src/finance/security/Audit.js

const crypto = require("crypto");

class Audit {
  constructor() {
    this.logs = [];
  }

  record({
    userId,
    action,
    status = "success",
    metadata = {}
  }) {
    const entry = {
      id: crypto.randomUUID(),
      userId: userId || null,
      action,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.logs.push(entry);

    return entry;
  }

  getByUser(userId) {
    return this.logs.filter(
      log => log.userId === userId
    );
  }

  getByAction(action) {
    return this.logs.filter(
      log => log.action === action
    );
  }

  getAll(limit = 100) {
    return this.logs
      .slice(-limit)
      .reverse();
  }
}

module.exports = new Audit();
