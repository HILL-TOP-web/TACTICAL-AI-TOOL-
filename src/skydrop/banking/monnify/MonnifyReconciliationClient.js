'use strict';

class MonnifyReconciliationError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = 'MonnifyReconciliationError';
    this.code = options.code || 'MONNIFY_RECONCILIATION_ERROR';
    this.retryable = options.retryable !== false;
    this.statusCode = options.statusCode;
  }
}

class MonnifyReconciliationClient {
  constructor(options = {}) {
    this.env = options.env || process.env;
    this.fetch = options.fetch || globalThis.fetch;
    this.clock = options.clock || Date.now;

    this.timeoutMs = Number(
      options.timeoutMs ||
      this.env.SKYDROP_RECONCILIATION_TIMEOUT_MS ||
      15000
    );

    this.accessToken = null;
    this.tokenExpiresAt = 0;

    if (typeof this.fetch !== 'function') {
      throw new Error(
        'A Fetch-compatible HTTP client is required.'
      );
    }

    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error('Invalid Monnify request timeout.');
    }
  }

  getBaseUrl() {
    const configuredUrl = (
      this.env.MONNIFY_BASE_URL || 'https://api.monnify.com'
    ).replace(/\/+$/, '');

    let parsed;

    try {
      parsed = new URL(configuredUrl);
    } catch {
      throw new Error('MONNIFY_BASE_URL is invalid.');
    }

    if (parsed.protocol !== 'https:') {
      throw new Error('Monnify must use HTTPS.');
    }

    if (parsed.hostname !== 'api.monnify.com') {
      throw new Error(
        'Only the configured Monnify production API host is permitted.'
      );
    }

    return configuredUrl;
  }

  requireCredentials() {
    const apiKey = this.env.MONNIFY_API_KEY;
    const secretKey = this.env.MONNIFY_SECRET_KEY;

    if (
      typeof apiKey !== 'string' ||
      !apiKey.trim() ||
      typeof secretKey !== 'string' ||
      !secretKey.trim()
    ) {
      throw new MonnifyReconciliationError(
        'Monnify API credentials are not configured.',
        {
          code: 'MONNIFY_CREDENTIALS_MISSING',
          retryable: false,
        }
      );
    }

    return {
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
    };
  }

  async request(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    );

    try {
      const response = await this.fetch(
        `${this.getBaseUrl()}${path}`,
        {
          ...options,
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
          },
        }
      );

      let body;

      try {
        body = await response.json();
      } catch {
        throw new MonnifyReconciliationError(
          'Monnify returned an invalid JSON response.',
          {
            code: 'MONNIFY_INVALID_RESPONSE',
          }
        );
      }

      if (!response.ok) {
        throw new MonnifyReconciliationError(
          `Monnify request failed with HTTP ${response.status}.`,
          {
            code: 'MONNIFY_HTTP_ERROR',
            statusCode: response.status,
            retryable: response.status === 429 ||
              response.status >= 500,
          }
        );
      }

      return body;
    } catch (error) {
      if (error instanceof MonnifyReconciliationError) {
        throw error;
      }

      throw new MonnifyReconciliationError(
        error.name === 'AbortError'
          ? 'Monnify request timed out.'
          : 'Unable to contact Monnify.',
        {
          code: error.name === 'AbortError'
            ? 'MONNIFY_TIMEOUT'
            : 'MONNIFY_NETWORK_ERROR',
        }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async authenticate() {
    if (
      this.accessToken &&
      this.tokenExpiresAt > this.clock() + 30000
    ) {
      return this.accessToken;
    }

    const { apiKey, secretKey } = this.requireCredentials();

    const basicToken = Buffer
      .from(`${apiKey}:${secretKey}`)
      .toString('base64');

    const response = await this.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicToken}`,
        },
      }
    );

    if (
      response.requestSuccessful !== true ||
      !response.responseBody ||
      typeof response.responseBody.accessToken !== 'string'
    ) {
      throw new MonnifyReconciliationError(
        'Monnify authentication was unsuccessful.',
        {
          code: 'MONNIFY_AUTH_FAILED',
          retryable: false,
        }
      );
    }

    const expiresIn = Number(
      response.responseBody.expiresIn || 300
    );

    this.accessToken = response.responseBody.accessToken;

    this.tokenExpiresAt = this.clock() +
      Math.max(30, expiresIn - 30) * 1000;

    return this.accessToken;
  }

  async getDisbursementStatus(reference) {
    if (
      typeof reference !== 'string' ||
      !reference.trim()
    ) {
      throw new TypeError(
        'A valid Monnify transfer reference is required.'
      );
    }

    const token = await this.authenticate();

    const query = new URLSearchParams({
      reference: reference.trim(),
    });

    const response = await this.request(
      `/api/v2/disbursements/single/summary?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      response.requestSuccessful !== true ||
      !response.responseBody
    ) {
      throw new MonnifyReconciliationError(
        'Monnify did not return a verified disbursement record.',
        {
          code: 'MONNIFY_STATUS_UNAVAILABLE',
        }
      );
    }

    const body = response.responseBody;

    if (
      typeof body.reference !== 'string' ||
      body.reference !== reference.trim()
    ) {
      throw new MonnifyReconciliationError(
        'The reference returned by Monnify does not match.',
        {
          code: 'MONNIFY_REFERENCE_MISMATCH',
          retryable: false,
        }
      );
    }

    const status = String(body.status || '').toUpperCase();

    const allowedStatuses = new Set([
      'SUCCESS',
      'COMPLETED',
      'FAILED',
      'REVERSED',
      'PENDING',
      'IN_PROGRESS',
      'AWAITING_PROCESSING',
      'PENDING_AUTHORIZATION',
      'PENDING_BATCH_AUTHORIZATION',
      'OTP_EMAIL_DISPATCH_FAILED',
      'EXPIRED',
    ]);

    if (!allowedStatuses.has(status)) {
      throw new MonnifyReconciliationError(
        'Monnify returned an unrecognized transaction status.',
        {
          code: 'MONNIFY_UNKNOWN_STATUS',
          retryable: false,
        }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new MonnifyReconciliationError(
        'Monnify returned an invalid transaction amount.',
        {
          code: 'MONNIFY_INVALID_AMOUNT',
          retryable: false,
        }
      );
    }

    return {
      reference: body.reference,
      transactionReference:
        typeof body.transactionReference === 'string'
          ? body.transactionReference
          : null,
      amount,
      currency: String(body.currency || '').toUpperCase(),
      status,
      description:
        typeof body.transactionDescription === 'string'
          ? body.transactionDescription
          : null,
      checkedAt: new Date(this.clock()),
    };
  }
}

module.exports = {
  MonnifyReconciliationClient,
  MonnifyReconciliationError,
};
