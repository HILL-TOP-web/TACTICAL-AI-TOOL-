// src/finance/banking/PayoutStatus.js

class PayoutStatus {
  constructor() {
    this.statuses = new Map();
  }

  create(reference, status = "pending") {
    if (!reference) {
      throw new Error("Payout reference is required");
    }

    const record = {
      reference,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.statuses.set(reference, record);

    return record;
  }

  update(reference, status, details = {}) {
    const record = this.statuses.get(reference);

    if (!record) {
      throw new Error("Payout not found");
    }

    record.status = status;
    record.details = details;
    record.updatedAt = new Date().toISOString();

    return record;
  }

  get(reference) {
    return this.statuses.get(reference) || null;
  }

  isFinal(status) {
    return [
      "completed",
      "failed",
      "cancelled",
      "reversed"
    ].includes(status);
  }
}

module.exports = new PayoutStatus();
