'use strict';

const crypto = require('crypto');

class MonnifyWebhookValidator {
    constructor() {
        this.secretKey = process.env.MONNIFY_SECRET_KEY;
    }

    validateConfiguration() {
        if (!this.secretKey) {
            throw new Error(
                'MONNIFY_SECRET_KEY is required.'
            );
        }
    }

    verifySignature(rawBody, signature) {
        this.validateConfiguration();

        if (!Buffer.isBuffer(rawBody)) {
            throw new Error(
                'Webhook raw request body is required.'
            );
        }

        if (typeof signature !== 'string' || !signature) {
            return false;
        }

        const expected = crypto
            .createHmac('sha512', this.secretKey)
            .update(rawBody)
            .digest();

        let supplied;

        try {
            supplied = Buffer.from(signature, 'hex');
        } catch {
            return false;
        }

        return supplied.length === expected.length &&
            crypto.timingSafeEqual(supplied, expected);
    }

    validateEvent(event) {
        if (!event || typeof event !== 'object') {
            return false;
        }

        if (!event.eventType || !event.eventData) {
            return false;
        }

        return true;
    }

    validate(rawBody, signature, event) {
        return (
            this.verifySignature(rawBody, signature) &&
            this.validateEvent(event)
        );
    }
}

module.exports = new MonnifyWebhookValidator();
