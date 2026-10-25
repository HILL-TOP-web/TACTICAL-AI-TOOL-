"use strict";

const crypto = require("node:crypto");

function safeEqualHex(left, right) {
  if (
    typeof left !== "string" ||
    typeof right !== "string" ||
    !/^[a-f0-9]{128}$/i.test(left) ||
    !/^[a-f0-9]{128}$/i.test(right)
  ) {
    return false;
  }

  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

function verifyMonnifySignature({
  rawBody,
  signature,
  secretKey
}) {
  if (!Buffer.isBuffer(rawBody)) {
    throw new Error("RAW_WEBHOOK_BODY_REQUIRED");
  }

  if (
    typeof secretKey !== "string" ||
    !secretKey.trim()
  ) {
    throw new Error("MONNIFY_SECRET_KEY_MISSING");
  }

  if (typeof signature !== "string") {
    return false;
  }

  const expected = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return safeEqualHex(signature, expected);
}

function normalizeStatus(value) {
  return String(value || "").trim().toUpperCase();
}

function createMonnifyWebhookHandler({
  onVerifiedEvent,
  secretProvider = () => process.env.MONNIFY_SECRET_KEY
}) {
  if (typeof onVerifiedEvent !== "function") {
    throw new Error("WEBHOOK_EVENT_HANDLER_REQUIRED");
  }

  return async function monnifyWebhookHandler(req, res) {
    try {
      const signature =
        req.get("monnify-signature") ||
        req.get("x-monnify-signature");

      const rawBody = req.rawBody;

      const secretKey = secretProvider();

      const valid = verifyMonnifySignature({
        rawBody,
        signature,
        secretKey
      });

      if (!valid) {
        return res.status(401).json({
          success: false,
          error: "INVALID_WEBHOOK_SIGNATURE"
        });
      }

      let event;

      try {
        event = JSON.parse(rawBody.toString("utf8"));
      } catch {
        return res.status(400).json({
          success: false,
          error: "INVALID_WEBHOOK_JSON"
        });
      }

      const eventType =
        event.eventType ||
        event.eventData?.eventType ||
        null;

      const data = event.eventData || event;

      const reference =
        data.transactionReference ||
        data.reference ||
        data.paymentReference ||
        null;

      const status = normalizeStatus(
        data.status ||
        data.transactionStatus
      );

      if (!reference) {
        return res.status(400).json({
          success: false,
          error: "WEBHOOK_REFERENCE_MISSING"
        });
      }

      // The event handler must persist the event durably,
      // deduplicate it, and reconcile authoritative status.
      await onVerifiedEvent({
        eventType,
        reference,
        status,
        data,
        receivedAt: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        received: true
      });
    } catch {
      return res.status(500).json({
        success: false,
        error: "WEBHOOK_PROCESSING_FAILED"
      });
    }
  };
}

module.exports = {
  verifyMonnifySignature,
  createMonnifyWebhookHandler
};
