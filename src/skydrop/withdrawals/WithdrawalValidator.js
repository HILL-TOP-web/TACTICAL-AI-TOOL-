"use strict";

class WithdrawalValidator {
  validate(input) {
    if (!input || typeof input !== "object") {
      throw new Error("WITHDRAWAL_INPUT_REQUIRED");
    }

    const userId = String(input.userId || "").trim();

    if (!userId) {
      throw new Error("USER_ID_REQUIRED");
    }

    const amountNGN = Number(input.amountNGN);

    if (
      !Number.isSafeInteger(amountNGN) ||
      amountNGN <= 0
    ) {
      throw new Error("INVALID_WITHDRAWAL_AMOUNT");
    }

    const accountNumber = String(
      input.destinationAccountNumber || ""
    ).trim();

    if (!/^\d{10}$/.test(accountNumber)) {
      throw new Error("INVALID_DESTINATION_ACCOUNT");
    }

    const bankCode = String(
      input.destinationBankCode || ""
    ).trim();

    if (!/^[A-Za-z0-9_-]{2,20}$/.test(bankCode)) {
      throw new Error("INVALID_DESTINATION_BANK_CODE");
    }

    const accountName = String(
      input.destinationAccountName || ""
    ).trim();

    if (
      accountName.length < 2 ||
      accountName.length > 150
    ) {
      throw new Error("INVALID_DESTINATION_ACCOUNT_NAME");
    }

    const idempotencyKey = String(
      input.idempotencyKey || ""
    ).trim();

    if (
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 200
    ) {
      throw new Error("INVALID_IDEMPOTENCY_KEY");
    }

    return {
      userId,
      amountNGN,
      destinationAccountNumber: accountNumber,
      destinationBankCode: bankCode,
      destinationAccountName: accountName,
      idempotencyKey,
      method: input.method || "MONNIFY",
      narration: String(
        input.narration || "SkyDrop withdrawal"
      ).slice(0, 140)
    };
  }
}

module.exports = {
  WithdrawalValidator
};
