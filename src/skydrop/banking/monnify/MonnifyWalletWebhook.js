'use strict';

const crypto = require('node:crypto');
const express = require('express');

const {
  config
} = require('../../../config/env');

const {
  reconcileReference
} = require('./MonnifyWalletReconciliation');

function safeEqualHex(actual, expected) {
  if (
    typeof actual !== 'string' ||
    typeof expected !== 'string'
  ) {
    return false;
  }

  if (
    !/^[a-f0-9]{128}$/i.test(actual) ||
    !/^[a-f0-9]{128}$/i.test(expected)
  ) {
    return false;
  }

  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function verifyEventWebhook(rawBody, signature) {
  if (
    !config.monnifyWebhookSecret ||
    !Buffer.isBuffer(rawBody)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac('sha512', config.monnifyWebhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeEqualHex(expected, signature);
}

function getSignature(req) {
  return req.get('monnify-signature') || '';
}

function createMonnifyWebhookRouter({ repository }) {
  if (!repository) {
    throw new Error(
      'Webhook router requires the persistent withdrawal repository.'
    );
  }

  const router = express.Router();

  // Keep express.raw() here. Do not parse this body with express.json()
  // before verifying the signature.
  router.post(
    '/',
    express.raw({
      type: 'application/json',
      limit: '256kb'
    }),
    async (req, res) => {
      const rawBody = req.body;

      if (
        !verifyEventWebhook(
          rawBody,
          getSignature(req)
        )
      ) {
        return res.status(401).json({
          ok: false,
          error: 'Invalid webhook signature.'
        });
      }

      let event;

      try {
        event = JSON.parse(
          rawBody.toString('utf8')
        );
      } catch {
        return res.status(400).json({
          ok: false,
          error: 'Invalid JSON webhook body.'
        });
      }

      const eventType = String(
        event.eventType || ''
      ).toUpperCase();

      // Ignore events unrelated to disbursements.
      if (!eventType.includes('DISBURSEMENT')) {
        return res.status(200).json({
          ok: true,
          ignored: true
        });
      }

      const eventData = event.eventData || {};

      const reference =
        eventData.reference ||
        eventData.paymentReference;

      if (!reference) {
        return res.status(400).json({
          ok: false,
          error: 'Disbursement reference missing.'
        });
      }

      try {
        // Do not trust the webhook alone as proof of final payment.
        // Query Monnify for the current transfer status.
        await reconcileReference(
          String(reference),
          repository
        );

        return res.status(200).json({
          ok: true,
          received: true
        });
      } catch (error) {
        console.error(
          '[monnify-webhook] Reconciliation deferred:',
          error.message
        );

        // The event was received, but final reconciliation must retry.
        return res.status(202).json({
          ok: true,
          received: true,
          reconciliationPending: true
        });
      }
    }
  );

  return router;
}

module.exports = {
  verifyEventWebhook,
  getSignature,
  createMonnifyWebhookRouter
};
