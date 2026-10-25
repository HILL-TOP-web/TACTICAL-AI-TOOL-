"use strict";

const crypto = require("node:crypto");

const WithdrawalConfig = require("./WithdrawalConfig");
const WithdrawalValidator = require("./WithdrawalValidator");
const WithdrawalMethod = require("./WithdrawalMethod");
const WithdrawalStatus = require("./WithdrawalStatus");
const MonnifyWithdrawalGateway = require(
  "./MonnifyWithdrawalGateway"
);

const requestsByKey = new Map();

function createError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

class WithdrawalEngine {
  constructor(options = {}) {
    this.gateway =
      options.gateway || MonnifyWithdrawalGateway;

    this.bankGateway = options.bankGateway || null;

    this.repository = options.repository || null;
  }

  async requestWithdrawal(request) {
    if (!WithdrawalConfig.enabled) {
      throw createError(
        "Withdrawals are currently disabled.",
        "WITHDRAWALS_DISABLED"
      );
    }

    const validated = WithdrawalValidator.validate(
      request
    );

    if (!validated.userId) {
      throw createError(
        "An authenticated user is required.",
        "AUTHENTICATION_REQUIRED"
      );
    }

    const key = crypto
      .createHash("sha256")
      .update(
        `${validated.userId}:${validated.idempotencyKey}`
      )
      .digest("hex");

    if (requestsByKey.has(key)) {
      return requestsByKey.get(key);
    }

    const operation = this.processWithdrawal(validated);

    requestsByKey.set(key, operation);

    try {
      return await operation;
    } catch (error) {
      /*
       * Keep the key after ambiguous provider failures.
       * Retrying with a new key could cause a duplicate payout.
       *
       * Production implementations must persist idempotency
       * records and reconcile uncertain provider outcomes.
       */
      if (
        error.code === "PROVIDER_OUTCOME_UNKNOWN" ||
        error.code === "WITHDRAWAL_RECONCILIATION_REQUIRED"
      ) {
        throw error;
      }

      requestsByKey.delete(key);
      throw error;
    }
  }

  async processWithdrawal(request) {
    const withdrawalId = crypto.randomUUID();

    const withdrawal = {
      id: withdrawalId,
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      method: request.method,
      recipient: request.recipient,
      status: WithdrawalStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.repository) {
      await this.repository.create(withdrawal);
    }

    try {
      WithdrawalMethod.assertEnabled(request.method);

      let result;

      if (request.method === WithdrawalMethod.MONNIFY) {
        result = await this.gateway.initiateWithdrawal({
          withdrawalId,
          idempotencyKey: request.idempotencyKey,
          amount: request.amount,
          recipient: request.recipient
        });
      } else if (request.method === WithdrawalMethod.BANK) {
        if (!this.bankGateway) {
          throw createError(
            "The bank withdrawal gateway is not configured.",
            "BANK_GATEWAY_UNAVAILABLE"
          );
        }

        result = await this.bankGateway.initiateWithdrawal({
          withdrawalId,
          idempotencyKey: request.idempotencyKey,
          amount: request.amount,
          recipient: request.recipient
        });
      }

      const updated = {
        ...withdrawal,
        providerReference: result.providerReference,
        status: result.status,
        updatedAt: new Date().toISOString()
      };

      if (this.repository) {
        await this.repository.update(
          withdrawalId,
          updated
        );
      }

      return updated;
    } catch (error) {
      const failedOrUncertain =
        error.code === "PROVIDER_OUTCOME_UNKNOWN" ||
        error.code === "WITHDRAWAL_RECONCILIATION_REQUIRED";

      const updated = {
        ...withdrawal,
        status: failedOrUncertain
          ? WithdrawalStatus.PROCESSING
          : WithdrawalStatus.FAILED,
        errorCode: error.code || "WITHDRAWAL_ERROR",
        updatedAt: new Date().toISOString()
      };

      if (this.repository) {
        await this.repository.update(
          withdrawalId,
          updated
        );
      }

      throw error;
    }
  }
}

module.exports = WithdrawalEngine;
