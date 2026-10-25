"use strict";

const crypto = require("node:crypto");

const {
  loadWithdrawalConfig,
  validateWithdrawalAmount,
  assertWithdrawalsEnabled
} = require("./WithdrawalConfig");

class WithdrawalEngine {
  constructor({
    walletService,
    transactionRepository,
    withdrawalGateway,
    configProvider = loadWithdrawalConfig
  }) {
    if (
      !walletService ||
      typeof walletService.reserveFunds !== "function" ||
      typeof walletService.releaseReservedFunds !== "function"
    ) {
      throw new Error("WALLET_SERVICE_INTERFACE_REQUIRED");
    }

    if (
      !transactionRepository ||
      typeof transactionRepository.findByIdempotencyKey !==
        "function" ||
      typeof transactionRepository.create !== "function" ||
      typeof transactionRepository.updateStatus !== "function"
    ) {
      throw new Error(
        "TRANSACTION_REPOSITORY_INTERFACE_REQUIRED"
      );
    }

    if (
      !withdrawalGateway ||
      typeof withdrawalGateway.initiateWithdrawal !== "function"
    ) {
      throw new Error(
        "WITHDRAWAL_GATEWAY_INTERFACE_REQUIRED"
      );
    }

    this.walletService = walletService;
    this.transactionRepository = transactionRepository;
    this.withdrawalGateway = withdrawalGateway;
    this.configProvider = configProvider;
  }

  async requestWithdrawal(input) {
    const config = this.configProvider();

    assertWithdrawalsEnabled(config);

    const amountNGN = validateWithdrawalAmount(
      input.amountNGN,
      config
    );

    const userId = String(input.userId || "").trim();

    if (!userId) {
      throw new Error("USER_ID_REQUIRED");
    }

    const idempotencyKey = String(
      input.idempotencyKey || ""
    ).trim();

    if (
      !idempotencyKey ||
      idempotencyKey.length > 200
    ) {
      throw new Error("IDEMPOTENCY_KEY_REQUIRED");
    }

    if (
      typeof input.destinationAccountNumber !== "string" ||
      !/^\d{10}$/.test(input.destinationAccountNumber)
    ) {
      throw new Error("INVALID_DESTINATION_ACCOUNT");
    }

    if (
      typeof input.destinationBankCode !== "string" ||
      !/^[A-Za-z0-9_-]{2,20}$/.test(
        input.destinationBankCode
      )
    ) {
      throw new Error("INVALID_DESTINATION_BANK_CODE");
    }

    const existing =
      await this.transactionRepository.findByIdempotencyKey(
        idempotencyKey
      );

    if (existing) {
      if (String(existing.userId) !== userId) {
        throw new Error("IDEMPOTENCY_KEY_CONFLICT");
      }

      if (Number(existing.amountNGN) !== amountNGN) {
        throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");
      }

      return existing;
    }

    const reference =
      `SKD-WD-${crypto.randomUUID()}`;

    let reserved = false;
    let transactionCreated = false;

    try {
      await this.walletService.reserveFunds({
        userId,
        amountNGN,
        reference
      });

      reserved = true;

      const transaction =
        await this.transactionRepository.create({
          reference,
          idempotencyKey,
          userId,
          amountNGN,
          currency: "NGN",
          method: "MONNIFY",
          status: "PROCESSING",
          destinationBankCode: input.destinationBankCode,

          // Store account details only where required,
          // with appropriate access controls and retention.
          destinationAccountNumber:
            input.destinationAccountNumber,

          createdAt: new Date().toISOString()
        });

      transactionCreated = true;

      const providerResult =
        await this.withdrawalGateway.initiateWithdrawal({
          reference,
          amountNGN,
          destinationAccountNumber:
            input.destinationAccountNumber,
          destinationBankCode:
            input.destinationBankCode,
          destinationAccountName:
            input.destinationAccountName,
          narration: input.narration
        });

      await this.transactionRepository.updateStatus(
        reference,
        "PENDING",
        {
          providerReference:
            providerResult.providerReference || reference,

          providerStatus:
            providerResult.providerStatus || "PENDING",

          submittedAt: new Date().toISOString()
        }
      );

      return {
        reference,
        amountNGN,
        currency: "NGN",
        status: "PENDING",
        providerAccepted: true,
        message:
          "Withdrawal submitted. Final status requires provider confirmation."
      };
    } catch (error) {
      // A provider timeout or ambiguous response does not prove
      // that the provider failed to execute the payment.
      const ambiguous =
        error.message === "MONNIFY_DISBURSEMENT_TIMEOUT" ||
        error.message === "MONNIFY_CONNECTION_FAILED";

      if (transactionCreated && ambiguous) {
        await this.transactionRepository.updateStatus(
          reference,
          "PENDING_RECONCILIATION",
          {
            reconciliationRequired: true,
            updatedAt: new Date().toISOString()
          }
        );

        return {
          reference,
          amountNGN,
          currency: "NGN",
          status: "PENDING_RECONCILIATION",
          message:
            "The provider outcome is uncertain. Reconcile this reference before retrying."
        };
      }

      // Release reserved funds only when it is safe to conclude
      // that no provider payment was accepted.
      if (reserved && !transactionCreated) {
        await this.walletService.releaseReservedFunds({
          userId,
          amountNGN,
          reference,
          reason: "WITHDRAWAL_NOT_SUBMITTED"
        });
      }

      if (transactionCreated && !ambiguous) {
        // Do not automatically refund here unless your provider
        // adapter has established that no disbursement occurred.
        await this.transactionRepository.updateStatus(
          reference,
          "PENDING_RECONCILIATION",
          {
            reconciliationRequired: true,
            updatedAt: new Date().toISOString()
          }
        );
      }

      throw error;
    }
  }
}

module.exports = {
  WithdrawalEngine
};
