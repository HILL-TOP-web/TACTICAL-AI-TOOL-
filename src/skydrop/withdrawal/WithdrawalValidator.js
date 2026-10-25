"use strict";

const WithdrawalLimits = require("./WithdrawalLimits");
const WithdrawalMethod = require("./WithdrawalMethod");

const ACCOUNT_NUMBER_PATTERN = /^\d{10}$/;
const BANK_CODE_PATTERN = /^[A-Za-z0-9_-]{2,20}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function createError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

class WithdrawalValidator {
  static validate(request) {
    if (!request || typeof request !== "object") {
      throw createError(
        "A withdrawal request is required.",
        "INVALID_REQUEST"
      );
    }

    const amount = WithdrawalLimits.assertValid(
      request.amount
    );

    const method = WithdrawalMethod.assertEnabled(
      request.method
    );

    const idempotencyKey = String(
      request.idempotencyKey || ""
    ).trim();

    if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
      throw createError(
        "A valid idempotency key of 8–128 characters is required.",
        "INVALID_IDEMPOTENCY_KEY"
      );
    }

    const recipient = request.recipient;

    if (!recipient || typeof recipient !== "object") {
      throw createError(
        "Recipient details are required.",
        "INVALID_RECIPIENT"
      );
    }

    const accountNumber = String(
      recipient.accountNumber || ""
    ).trim();

    const bankCode = String(
      recipient.bankCode || ""
    ).trim();

    const accountName = String(
      recipient.accountName || ""
    ).trim();

    if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
      throw createError(
        "Recipient account number must contain exactly 10 digits.",
        "INVALID_ACCOUNT_NUMBER"
      );
    }

    if (!BANK_CODE_PATTERN.test(bankCode)) {
      throw createError(
        "A valid bank code is required.",
        "INVALID_BANK_CODE"
      );
    }

    if (
      accountName.length < 2 ||
      accountName.length > 120
    ) {
      throw createError(
        "Recipient account name must contain 2–120 characters.",
        "INVALID_ACCOUNT_NAME"
      );
    }

    return Object.freeze({
      userId: String(request.userId || "").trim(),
      amount,
      currency: "NGN",
      method,
      idempotencyKey,
      recipient: Object.freeze({
        accountNumber,
        bankCode,
        accountName
      })
    });
  }
}

module.exports = WithdrawalValidator;
