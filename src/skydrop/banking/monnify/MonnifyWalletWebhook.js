'use strict';

const crypto = require('node:crypto');

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

function verifyWebhookSignature(rawBody, signature) {
    if (!Buffer.isBuffer(rawBody) || !signature) {
        return false;
    }

    const config = getMonnifyConfig();

    const expected = crypto
        .createHmac('sha512', config.webhookSecret)
        .update(rawBody)
        .digest();

    let supplied;

    try {
        supplied = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }

    if (supplied.length !== expected.length) {
        return false;
    }

    return crypto.timingSafeEqual(expected, supplied);
}

function parseWebhookEvent(rawBody) {
    let event;

    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch {
        throw new Error('Invalid webhook JSON.');
    }

    if (!event || typeof event !== 'object') {
        throw new Error('Invalid webhook event.');
    }

    return event;
}

function createMonnifyWebhookHandler({
    reconciliationService
}) {
    if (
        !reconciliationService ||
        typeof reconciliationService.processWebhook !== 'function'
    ) {
        throw new Error(
            'A reconciliation service is required.'
        );
    }

    return async function monnifyWebhookHandler(req, res, next) {
        try {
            const signature =
                req.get('monnify-signature') ||
                req.get('x-monnify-signature');

            const rawBody = req.body;

            if (
                !verifyWebhookSignature(
                    rawBody,
                    signature
                )
            ) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid webhook signature.'
                });
            }

            const event = parseWebhookEvent(rawBody);

            await reconciliationService.processWebhook(event);

            return res.status(200).json({
                success: true,
                received: true
            });
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = {
    verifyWebhookSignature,
    parseWebhookEvent,
    createMonnifyWebhookHandler
};
