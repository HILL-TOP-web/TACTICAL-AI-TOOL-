"use strict";

const {
  getMonnifyConfig,
  assertMonnifyEnabled
} = require("./MonnifyConfig");

class MonnifyAuth {
  constructor({
    fetchImpl = globalThis.fetch,
    configProvider = getMonnifyConfig
  } = {}) {
    if (typeof fetchImpl !== "function") {
      throw new Error("FETCH_API_UNAVAILABLE");
    }

    this.fetch = fetchImpl;
    this.configProvider = configProvider;

    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.pendingAuthentication = null;
  }

  async getAccessToken({ forceRefresh = false } = {}) {
    if (
      !forceRefresh &&
      this.cachedToken &&
      Date.now() < this.tokenExpiresAt
    ) {
      return this.cachedToken;
    }

    if (this.pendingAuthentication) {
      return this.pendingAuthentication;
    }

    this.pendingAuthentication = this.authenticate();

    try {
      return await this.pendingAuthentication;
    } finally {
      this.pendingAuthentication = null;
    }
  }

  async authenticate() {
    const config = this.configProvider();

    assertMonnifyEnabled(config);

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      config.requestTimeoutMs
    );

    try {
      const response = await this.fetch(
        `${config.baseUrl}/api/v1/auth/login`,
        {
          method: "POST",

          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${config.apiKey}:${config.secretKey}`
              ).toString("base64"),

            Accept: "application/json"
          },

          signal: controller.signal
        }
      );

      const body = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        body.requestSuccessful !== true ||
        !body.responseBody?.accessToken
      ) {
        throw new Error("MONNIFY_AUTHENTICATION_FAILED");
      }

      const token = body.responseBody.accessToken;

      const expiresInSeconds = Number(
        body.responseBody.expiresIn || 300
      );

      if (
        !Number.isFinite(expiresInSeconds) ||
        expiresInSeconds <= 0
      ) {
        throw new Error("INVALID_MONNIFY_TOKEN_EXPIRY");
      }

      this.cachedToken = token;

      // Refresh early to reduce the chance of using an expired token.
      this.tokenExpiresAt =
        Date.now() +
        Math.max(1, expiresInSeconds - 30) * 1000;

      return token;
    } catch (error) {
      this.cachedToken = null;
      this.tokenExpiresAt = 0;

      if (error.name === "AbortError") {
        throw new Error("MONNIFY_AUTHENTICATION_TIMEOUT");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  clearToken() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }
}

module.exports = {
  MonnifyAuth
};
