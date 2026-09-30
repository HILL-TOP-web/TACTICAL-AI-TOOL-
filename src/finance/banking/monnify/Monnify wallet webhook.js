// 3. src/finance/banking/monnify/MonnifyWalletWebhook.js

"use strict";

const crypto = require("crypto");
const MonnifyFunding = require("./MonnifyFunding");

class MonnifyWalletWebhook {
  constructor(options = {}) {
    this.client =
      options.client ||
      new MonnifyFunding(options);

    this.toleranceSeconds = Number(
      options.toleranceSeconds ||
        process.env.MONNIFY_WEBHOOK_TOLERANCE_SECONDS ||
        300
    );

    this.processedReferences = new Set();
  }

  getHeader(headers = {}, name) {
    if (headers[name]) {
      return headers[name];
    }

    const lowerName = name.toLowerCase();

    const key = Object.keys(headers).find(
      (header) =>
        header.toLowerCase() === lowerName
    );

    return key ? headers[key] : undefined;
  }

  verifySignature(rawBody, headers = {}) {
    const signature =
      this.getHeader(
        headers,
        "monnify-signature"
      );

    return this.client.verifyWebhookSignature(
      rawBody,
      signature
    );
  }

  verifyTimestamp(headers = {}) {
    const timestamp =
      this.getHeader(
        headers,
        "x-monnify-timestamp"
      );

    /*
     * Ordinary Monnify webhook documentation does not
     * require this timestamp header for every webhook.
     *
     * If supplied, validate it to provide replay protection.
     */
    if (!timestamp) {
      return {
        valid: true,
        supplied: false
      };
    }

    let timestampMs;

    if (/^\d+$/.test(String(timestamp))) {
      const numeric = Number(timestamp);

      timestampMs =
        numeric < 100000000000
          ? numeric * 1000
          : numeric;
    } else {
      timestampMs =
        Date.parse(String(timestamp));
    }

    if (!Number.isFinite(timestampMs)) {
      return {
        valid: false,
        supplied: true,
        reason: "INVALID_TIMESTAMP"
      };
    }

    const ageSeconds =
      Math.abs(Date.now() - timestampMs) /
      1000;

    return {
      valid:
        ageSeconds <= this.toleranceSeconds,

      supplied: true,

      ageSeconds
    };
  }

  parseBody(rawBody) {
    if (typeof rawBody === "object" && rawBody) {
      return rawBody;
    }

    if (typeof rawBody !== "string") {
      throw new Error(
        "Webhook body must be a string or object"
      );
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      throw new Error(
        "Invalid JSON webhook body"
      );
    }
  }

  getEventReference(payload) {
    const eventData =
      payload?.eventData || {};

    return (
      eventData.reference ||
      eventData.transactionReference ||
      eventData.paymentReference ||
      eventData.batchReference ||
      payload?.requestId ||
      null
    );
  }

  normalizeAccountActivity(payload) {
    const eventData =
      payload?.eventData || {};

    return {
      eventType:
        payload?.eventType ||
        "ACCOUNT_ACTIVITY",

      activityType:
        eventData.activityType ||
        null,

      reference:
        eventData.reference ||
        null,

      accountType:
        eventData.accountType ||
        null,

      accountName:
        eventData.accountName ||
        null,

      accountNumber:
        eventData.accountNumber ||
        null,

      accountNuban:
        eventData.accountNuban ||
        null,

      amount:
        Number(eventData.amount || 0),

      currency:
        eventData.currency ||
        "NGN",

      balanceBefore:
        Number(eventData.balanceBefore || 0),

      balanceAfter:
        Number(eventData.balanceAfter || 0),

      narration:
        eventData.narration ||
        null,

      activityTime:
        eventData.activityTime ||
        null,

      metadata:
        eventData.metaData ||
        payload?.metaData ||
        {},

      receivedAt:
        new Date().toISOString(),

      raw:
        payload
    };
  }

  isCreditActivity(activity) {
    const type =
      String(
        activity?.activityType || ""
      ).toUpperCase();

    return (
      type.includes("CREDIT") ||
      type === "CREDIT"
    );
  }

  isDebitActivity(activity) {
    const type =
      String(
        activity?.activityType || ""
      ).toUpperCase();

    return (
      type.includes("DEBIT") ||
      type === "DEBIT"
    );
  }

  async handle(rawBody, headers = {}) {
    const signatureValid =
      this.verifySignature(
        rawBody,
        headers
      );

    /*
     * Production webhooks should have a signature.
     * Sandbox notifications may not include one.
     */
    const environment =
      String(
        process.env.MONNIFY_ENVIRONMENT ||
          ""
      ).toLowerCase();

    if (!signatureValid && environment === "production") {
      const error = new Error(
        "Invalid Monnify webhook signature"
      );

      error.code =
        "INVALID_MONNIFY_SIGNATURE";

      throw error;
    }

    const timestamp =
      this.verifyTimestamp(headers);

    if (!timestamp.valid) {
      const error = new Error(
        "Monnify webhook timestamp is invalid or expired"
      );

      error.code =
        "EXPIRED_MONNIFY_WEBHOOK";

      error.details = timestamp;

      throw error;
    }

    const payload =
      this.parseBody(rawBody);

    const eventType =
      String(
        payload?.eventType || ""
      ).toUpperCase();

    const reference =
      this.getEventReference(payload);

    if (
      reference &&
      this.processedReferences.has(reference)
    ) {
      return {
        accepted: true,
        duplicate: true,
        reference,
        eventType
      };
    }

    let normalized = null;

    if (
      eventType === "ACCOUNT_ACTIVITY"
    ) {
      normalized =
        this.normalizeAccountActivity(
          payload
        );
    } else {
      normalized = {
        eventType,
        reference,
        receivedAt:
          new Date().toISOString(),
        raw: payload
      };
    }

    if (reference) {
      this.processedReferences.add(
        reference
      );
    }

    return {
      accepted: true,
      duplicate: false,
      signatureValid,
      timestampValid:
        timestamp.valid,
      eventType,
      reference,
      data: normalized
    };
  }

  async expressHandler(req, res, next) {
    try {
      /*
       * req.rawBody must be configured before JSON parsing
       * if you want exact raw-body HMAC verification.
       *
       * Example:
       *
       * app.use(express.json({
       *   verify: (req, res, buf) => {
       *     req.rawBody = buf.toString("utf8");
       *   }
       * }));
       */

      const rawBody =
        req.rawBody ||
        JSON.stringify(req.body);

      const result =
        await this.handle(
          rawBody,
          req.headers
        );

      return res.status(200).json({
        requestSuccessful: true,
        responseCode: "0",
        responseMessage: "Webhook received",
        data: {
          reference:
            result.reference,
          eventType:
            result.eventType,
          duplicate:
            result.duplicate
        }
      });
    } catch (error) {
      if (typeof next === "function") {
        return next(error);
      }

      return res.status(400).json({
        requestSuccessful: false,
        responseCode: "WEBHOOK_ERROR",
        responseMessage:
          error.message
      });
    }
  }
}

module.exports = MonnifyWalletWebhook;
