"use strict";

const crypto = require("node:crypto");

const {
  getMonnifyConfig,
  assertMonnifyEnabled
} = require("./MonnifyConfig");

const { MonnifyAuth } = require("./MonnifyAuth");

class MonnifyDisbursement {
  constructor({
    fetchImpl = globalThis.fetch,
    auth = new MonnifyAuth({ fetchImpl }),
    configProvider = getMonnifyConfig
  } = {}) {
    this.fetch = fetchImpl;
    this.auth = auth;
    this.configProvider = configProvider;
  }

  createReference() {
    return `SKD-WD-${crypto.randomUUID()}`;
  }

  async initiate({
    amount,
    reference,
    destinationAccountNumber,
    destinationBankCode,
    destinationAccountName,
    narration = "SkyDrop withdrawal"
  }) {
    const config = this.configProvider();

    assertMonnifyEnabled(config);

    if (!Number.isSafeInteger(amount) || amount < 100) {
      throw new Error("INVALID_DISBURSEMENT_AMOUNT");
    }

    if (
      typeof reference !== "string" ||
      !/^[A-Za-z0-9_-]{8,100}$/.test(reference)
    ) {
      throw new Error("INVALID_DISBURSEMENT_REFERENCE");
    }

    if (
      typeof destinationAccountNumber !== "string" ||
      !/^\d{10}$/.test(destinationAccountNumber)
    ) {
      throw new Error("INVALID_DESTINATION_ACCOUNT");
    }

    if (
      typeof destinationBankCode !== "string" ||
      !/^[A-Za-z0-9_-]{2,20}$/.test(destinationBankCode)
    ) {
      throw new Error("INVALID_DESTINATION_BANK_CODE");
    }

    if (
      typeof destinationAccountName !== "string" ||
      !destinationAccountName.trim()
    ) {
      throw new Error("DESTINATION_ACCOUNT_NAME_REQUIRED");
    }

    const accessToken = await this.auth.getAccessToken();

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      config.requestTimeoutMs
    );

    try {
      const response = await this.fetch(
        `${config.baseUrl}${config.disbursementPath}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },

          body: JSON.stringify({
            amount,
            reference,
            narration,
            destinationBankCode,
            destinationAccountNumber,
            destinationAccountName,
            currency: "NGN",
            contractCode: config.contractCode
          }),

          signal: controller.signal
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok || body.requestSuccessful !== true) {
        const error = new Error(
          "MONNIFY_DISBURSEMENT_REQUEST_FAILED"
        );

        error.providerStatus = response.status;
        error.providerResponseCode = body.responseCode || null;

        throw error;
      }

      const result = body.responseBody || {};

      return {
        reference,
        providerReference:
          result.reference ||
          result.transactionReference ||
          reference,

        providerStatus:
          result.status ||
          result.transactionStatus ||
          "PENDING",

        accepted: true,

        // Acceptance is not proof of completed payment.
        completed: false
      };
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error(
          "MONNIFY_DISBURSEMENT_TIMEOUT"
        );

        timeoutError.reference = reference;

        throw timeoutError;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = {
  MonnifyDisbursement
};
