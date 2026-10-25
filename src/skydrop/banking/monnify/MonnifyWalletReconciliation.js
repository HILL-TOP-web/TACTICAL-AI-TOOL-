"use strict";

const {
  getMonnifyConfig,
  assertMonnifyEnabled
} = require("./MonnifyConfig");

const { MonnifyAuth } = require("./MonnifyAuth");

const FINAL_STATUSES = new Set([
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REVERSED"
]);

function normalizeProviderStatus(status) {
  const value = String(status || "")
    .trim()
    .toUpperCase();

  if (["SUCCESS", "SUCCESSFUL", "COMPLETED"].includes(value)) {
    return "SUCCESS";
  }

  if (["FAILED", "FAILURE"].includes(value)) {
    return "FAILED";
  }

  if (["CANCELLED", "CANCELED"].includes(value)) {
    return "CANCELLED";
  }

  if (["REVERSED", "REVERSAL"].includes(value)) {
    return "REVERSED";
  }

  return "PENDING";
}

class MonnifyWalletReconciliation {
  constructor({
    fetchImpl = globalThis.fetch,
    auth = new MonnifyAuth({ fetchImpl }),
    configProvider = getMonnifyConfig,
    statusPath
  } = {}) {
    this.fetch = fetchImpl;
    this.auth = auth;
    this.configProvider = configProvider;

    // Configure this only after confirming the exact
    // status-query endpoint for your Monnify account.
    this.statusPath =
      statusPath ||
      process.env.MONNIFY_TRANSACTION_STATUS_PATH;
  }

  async getProviderStatus(reference) {
    const config = this.configProvider();

    assertMonnifyEnabled(config);

    if (
      typeof reference !== "string" ||
      !/^[A-Za-z0-9_-]{8,100}$/.test(reference)
    ) {
      throw new Error("INVALID_TRANSACTION_REFERENCE");
    }

    if (
      typeof this.statusPath !== "string" ||
      !this.statusPath.includes("{reference}")
    ) {
      throw new Error(
        "MONNIFY_STATUS_ENDPOINT_NOT_CONFIGURED"
      );
    }

    const path = this.statusPath.replace(
      "{reference}",
      encodeURIComponent(reference)
    );

    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("://")
    ) {
      throw new Error("INVALID_MONNIFY_STATUS_PATH");
    }

    const accessToken = await this.auth.getAccessToken();

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      config.requestTimeoutMs
    );

    try {
      const response = await this.fetch(
        `${config.baseUrl}${path}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json"
          },

          signal: controller.signal
        }
      );

      const body = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        body.requestSuccessful !== true
      ) {
        throw new Error(
          "MONNIFY_STATUS_QUERY_FAILED"
        );
      }

      const data = body.responseBody || {};

      return {
        reference,

        providerReference:
          data.transactionReference ||
          data.reference ||
          reference,

        status: normalizeProviderStatus(
          data.status || data.transactionStatus
        ),

        final: FINAL_STATUSES.has(
          normalizeProviderStatus(
            data.status || data.transactionStatus
          )
        ),

        amount:
          data.amount === undefined
            ? null
            : Number(data.amount),

        currency: data.currency || null
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "MONNIFY_STATUS_QUERY_TIMEOUT"
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async reconcile({
    reference,
    transactionRepository
  }) {
    if (
      !transactionRepository ||
      typeof transactionRepository.findByReference !==
        "function" ||
      typeof transactionRepository.updateStatus !==
        "function"
    ) {
      throw new Error(
        "TRANSACTION_REPOSITORY_INTERFACE_REQUIRED"
      );
    }

    const transaction =
      await transactionRepository.findByReference(reference);

    if (!transaction) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    const provider = await this.getProviderStatus(reference);

    // A provider status must not silently override a different
    // transaction amount or currency.
    if (
      provider.amount !== null &&
      Number(transaction.amountNGN) !== provider.amount
    ) {
      throw new Error(
        "PROVIDER_TRANSACTION_AMOUNT_MISMATCH"
      );
    }

    if (
      provider.currency &&
      provider.currency !== "NGN"
    ) {
      throw new Error(
        "PROVIDER_TRANSACTION_CURRENCY_MISMATCH"
      );
    }

    const currentStatus = String(
      transaction.status || ""
    ).toUpperCase();

    // Never overwrite an existing terminal state automatically
    // with a conflicting terminal state.
    if (
      FINAL_STATUSES.has(currentStatus) &&
      currentStatus !== provider.status
    ) {
      throw new Error(
        "CONFLICTING_FINAL_TRANSACTION_STATUS"
      );
    }

    if (!provider.final) {
      return {
        reference,
        status: "PENDING",
        reconciled: false
      };
    }

    await transactionRepository.updateStatus(
      reference,
      provider.status,
      {
        providerReference: provider.providerReference,
        reconciledAt: new Date().toISOString()
      }
    );

    return {
      reference,
      status: provider.status,
      reconciled: true
    };
  }
}

module.exports = {
  MonnifyWalletReconciliation,
  normalizeProviderStatus
};
