"use strict";

const WithdrawalConfig = require("./WithdrawalConfig");

function createError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getMonnifyConfig() {
  return {
    baseUrl: process.env.MONNIFY_BASE_URL,
    apiKey: process.env.MONNIFY_API_KEY,
    secretKey: process.env.MONNIFY_SECRET_KEY,
    contractCode: process.env.MONNIFY_CONTRACT_CODE
  };
}

function validateMonnifyConfig() {
  const config = getMonnifyConfig();

  const missing = Object.entries(config)
    .filter(([, value]) =>
      typeof value !== "string" || !value.trim()
    )
    .map(([key]) => key);

  if (missing.length > 0) {
    return {
      valid: false,
      code: "MONNIFY_ENV_MISSING",
      missing
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(config.baseUrl);
  } catch {
    return {
      valid: false,
      code: "MONNIFY_INVALID_BASE_URL",
      missing: []
    };
  }

  if (
    !["https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return {
      valid: false,
      code: "MONNIFY_INVALID_BASE_URL",
      missing: []
    };
  }

  return {
    valid: true,
    config
  };
}

class MonnifyWithdrawalGateway {
  static getReadiness() {
    if (!WithdrawalConfig.enabled) {
      return {
        ready: false,
        reason: "WITHDRAWALS_DISABLED"
      };
    }

    if (
      !WithdrawalConfig.monnifyEnabled ||
      !WithdrawalConfig.monnifyWithdrawalsEnabled
    ) {
      return {
        ready: false,
        reason: "MONNIFY_WITHDRAWALS_DISABLED"
      };
    }

    const validation = validateMonnifyConfig();

    if (!validation.valid) {
      return {
        ready: false,
        reason: validation.code,
        missing: validation.missing
      };
    }

    return {
      ready: false,
      reason: "MONNIFY_TRANSFER_ADAPTER_NOT_CONFIGURED"
    };
  }

  static async checkConnectivity() {
    const validation = validateMonnifyConfig();

    if (!validation.valid) {
      return {
        reachable: false,
        reason: validation.code,
        missing: validation.missing
      };
    }

    const baseUrl = validation.config.baseUrl.replace(
      /\/+$/,
      ""
    );

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      WithdrawalConfig.requestTimeoutMs
    );

    try {
      /*
       * This only checks whether the configured host responds.
       * It does not authenticate the API key or verify
       * disbursement permissions.
       *
       * Use a documented Monnify endpoint and the proper
       * authentication adapter for a real integration.
       */
      const response = await fetch(baseUrl, {
        method: "GET",
        signal: controller.signal,
        redirect: "error"
      });

      return {
        reachable: true,
        httpStatus: response.status,
        authenticated: false,
        transferReady: false
      };
    } catch {
      return {
        reachable: false,
        authenticated: false,
        transferReady: false,
        reason: "MONNIFY_CONNECTIVITY_CHECK_FAILED"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  static async initiateWithdrawal() {
    const readiness = this.getReadiness();

    if (!readiness.ready) {
      throw createError(
        "Monnify withdrawals are not ready. No transfer was initiated.",
        readiness.reason
      );
    }

    /*
     * Intentionally unreachable until an authenticated,
     * tested Monnify disbursement adapter is implemented.
     *
     * Never replace this guard with a fabricated successful
     * response. Provider acceptance is not proof of settlement.
     */

    throw createError(
      "Monnify disbursement adapter is not implemented.",
      "MONNIFY_TRANSFER_ADAPTER_NOT_CONFIGURED"
    );
  }
}

module.exports = MonnifyWithdrawalGateway;
