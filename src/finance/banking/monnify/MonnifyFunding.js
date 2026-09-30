// 1. src/finance/banking/monnify/MonnifyFunding.js

"use strict";

const crypto = require("crypto");

class MonnifyFunding {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ||
      process.env.MONNIFY_BASE_URL ||
      "https://api.monnify.com";

    this.apiKey =
      options.apiKey ||
      process.env.MONNIFY_API_KEY;

    this.secretKey =
      options.secretKey ||
      process.env.MONNIFY_SECRET_KEY;

    this.contractCode =
      options.contractCode ||
      process.env.MONNIFY_CONTRACT_CODE;

    this.walletAccountNumber =
      options.walletAccountNumber ||
      process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;

    this.timeoutMs = Number(
      options.timeoutMs ||
        process.env.MONNIFY_REQUEST_TIMEOUT_MS ||
        30000
    );

    this.accessToken = null;
    this.accessTokenExpiresAt = 0;

    this.requireConfig();
  }

  requireConfig() {
    const missing = [];

    if (!this.apiKey) {
      missing.push("MONNIFY_API_KEY");
    }

    if (!this.secretKey) {
      missing.push("MONNIFY_SECRET_KEY");
    }

    if (!this.contractCode) {
      missing.push("MONNIFY_CONTRACT_CODE");
    }

    if (!this.walletAccountNumber) {
      missing.push("MONNIFY_WALLET_ACCOUNT_NUMBER");
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing Monnify configuration: ${missing.join(", ")}`
      );
    }
  }

  buildUrl(path) {
    return `${this.baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }

  async request(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(this.buildUrl(path), {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      const text = await response.text();

      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = {
          raw: text
        };
      }

      if (!response.ok) {
        const error = new Error(
          data?.responseMessage ||
            data?.message ||
            `Monnify request failed with HTTP ${response.status}`
        );

        error.statusCode = response.status;
        error.response = data;

        throw error;
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async authenticate() {
    if (
      this.accessToken &&
      Date.now() < this.accessTokenExpiresAt
    ) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.apiKey}:${this.secretKey}`
    ).toString("base64");

    const response = await this.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`
        },
        body: JSON.stringify({})
      }
    );

    if (
      !response ||
      !response.requestSuccessful ||
      !response.responseBody?.accessToken
    ) {
      throw new Error(
        response?.responseMessage ||
          "Unable to authenticate with Monnify"
      );
    }

    const body = response.responseBody;

    const expiresIn = Number(body.expiresIn || 3600);

    this.accessToken = body.accessToken;

    // Refresh slightly before expiry.
    this.accessTokenExpiresAt =
      Date.now() +
      Math.max(expiresIn - 60, 30) * 1000;

    return this.accessToken;
  }

  async authenticatedRequest(path, options = {}) {
    const token = await this.authenticate();

    return this.request(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  generateFundingReference(prefix = "SKD-FUND") {
    const timestamp = Date.now();

    const randomPart = crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase();

    return `${prefix}-${timestamp}-${randomPart}`;
  }

  createFundingRecord({
    amount,
    currency = "NGN",
    reference,
    narration = "SkyDrop to Monnify wallet funding"
  } = {}) {
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      throw new Error("Funding amount must be greater than zero");
    }

    const fundingReference =
      reference || this.generateFundingReference();

    return {
      reference: fundingReference,
      amount: numericAmount,
      currency,
      source: "SKYDROp".toUpperCase(),
      destination: "MONNIFY_WALLET",
      destinationAccountNumber: this.walletAccountNumber,
      contractCode: this.contractCode,
      narration,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
  }

  async getWalletBalance(accountNumber) {
    const account =
      accountNumber || this.walletAccountNumber;

    if (!account) {
      throw new Error(
        "Monnify wallet account number is required"
      );
    }

    const response =
      await this.authenticatedRequest(
        `/api/v2/disbursements/wallet-balance?accountNumber=${encodeURIComponent(
          account
        )}`,
        {
          method: "GET"
        }
      );

    if (!response?.requestSuccessful) {
      throw new Error(
        response?.responseMessage ||
          "Unable to retrieve Monnify wallet balance"
      );
    }

    return response.responseBody;
  }

  verifyFundingAmount(expectedAmount, actualAmount) {
    const expected = Number(expectedAmount);
    const actual = Number(actualAmount);

    if (!Number.isFinite(expected)) {
      throw new Error("Invalid expected funding amount");
    }

    if (!Number.isFinite(actual)) {
      throw new Error("Invalid actual funding amount");
    }

    return Math.abs(expected - actual) < 0.000001;
  }

  generateWebhookHash(rawBody) {
    if (!this.secretKey) {
      throw new Error(
        "MONNIFY_SECRET_KEY is required"
      );
    }

    return crypto
      .createHmac("sha512", this.secretKey)
      .update(
        typeof rawBody === "string"
          ? rawBody
          : JSON.stringify(rawBody)
      )
      .digest("hex");
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!signature) {
      return false;
    }

    const expected =
      this.generateWebhookHash(rawBody);

    const received = String(signature).trim();

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(received, "utf8")
    );
  }
}

module.exports = MonnifyFunding;
