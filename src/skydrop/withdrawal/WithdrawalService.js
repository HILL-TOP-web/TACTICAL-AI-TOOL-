"use strict";

const WithdrawalEngine = require("./WithdrawalEngine");
const WithdrawalStatus = require("./WithdrawalStatus");

class WithdrawalService {
  constructor(options = {}) {
    this.engine =
      options.engine || new WithdrawalEngine();

    this.repository = options.repository || null;
  }

  async requestWithdrawal(request) {
    if (!request || !request.userId) {
      const error = new Error(
        "Authentication is required to request a withdrawal."
      );

      error.code = "AUTHENTICATION_REQUIRED";
      throw error;
    }

    return this.engine.requestWithdrawal(request);
  }

  async getWithdrawal(withdrawalId, userId) {
    if (!this.repository) {
      const error = new Error(
        "Withdrawal repository is not configured."
      );

      error.code = "WITHDRAWAL_REPOSITORY_UNAVAILABLE";
      throw error;
    }

    if (!withdrawalId || !userId) {
      const error = new Error(
        "Withdrawal ID and authenticated user are required."
      );

      error.code = "INVALID_LOOKUP";
      throw error;
    }

    const withdrawal = await this.repository.findById(
      withdrawalId
    );

    if (
      !withdrawal ||
      withdrawal.userId !== String(userId)
    ) {
      const error = new Error(
        "Withdrawal not found."
      );

      error.code = "WITHDRAWAL_NOT_FOUND";
      throw error;
    }

    return withdrawal;
  }

  async getUserWithdrawals(userId, options = {}) {
    if (!this.repository) {
      const error = new Error(
        "Withdrawal repository is not configured."
      );

      error.code = "WITHDRAWAL_REPOSITORY_UNAVAILABLE";
      throw error;
    }

    if (!userId) {
      const error = new Error(
        "Authenticated user is required."
      );

      error.code = "AUTHENTICATION_REQUIRED";
      throw error;
    }

    const limit = Number(options.limit || 20);
    const offset = Number(options.offset || 0);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      const error = new Error(
        "Invalid pagination parameters."
      );

      error.code = "INVALID_PAGINATION";
      throw error;
    }

    return this.repository.findByUserId(
      String(userId),
      { limit, offset }
    );
  }

  async getStatus(withdrawalId, userId) {
    const withdrawal = await this.getWithdrawal(
      withdrawalId,
      userId
    );

    return {
      id: withdrawal.id,
      status: withdrawal.status,
      currency: withdrawal.currency,
      amount: withdrawal.amount,
      updatedAt: withdrawal.updatedAt
    };
  }

  static getStatuses() {
    return WithdrawalStatus;
  }
}

module.exports = WithdrawalService;
