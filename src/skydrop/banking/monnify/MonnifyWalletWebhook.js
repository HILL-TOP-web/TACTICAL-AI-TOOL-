'use strict';

const crypto = require('crypto');

class MonnifyWalletWebhook {
    constructor(options = {}) {
        this.secretKey =
            options.secretKey ||
            process.env.MONNIFY_SECRET_KEY ||
            '';

        if (!this.secretKey) {
            throw new Error(
                'MONNIFY_SECRET_KEY is required for webhook verification.'
            );
        }
    }

    /**
     * Verify the Monnify signature against the original raw body.
     *
     * Configure Express to preserve the raw bytes before JSON
     * parsing. Never verify a reconstructed JSON string.
     */
    verifySignature(rawBody, signature) {
        if (
            !Buffer.isBuffer(rawBody) ||
            typeof signature !== 'string' ||
            !signature.trim()
        ) {
            return false;
        }

        const expected = crypto
            .createHmac('sha512', this.secretKey)
            .update(rawBody)
            .digest('hex');

        const actualBuffer = Buffer.from(
            signature.trim(),
            'utf8'
        );

        const expectedBuffer = Buffer.from(
            expected,
            'utf8'
        );

        if (actualBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            actualBuffer,
            expectedBuffer
        );
    }

    /**
     * Validate the structure of a parsed webhook.
     *
     * This does not by itself prove that the event is genuine.
     * Always verify the signature first.
     */
    validatePayload(payload) {
        if (
            !payload ||
            typeof payload !== 'object' ||
            Array.isArray(payload)
        ) {
            throw new Error(
                'Invalid Monnify webhook payload.'
            );
        }

        if (
            typeof payload.eventType !== 'string' ||
            !payload.eventType.trim()
        ) {
            throw new Error(
                'Monnify webhook eventType is required.'
            );
        }

        if (
            !payload.eventData ||
            typeof payload.eventData !== 'object' ||
            Array.isArray(payload.eventData)
        ) {
            throw new Error(
                'Monnify webhook eventData is required.'
            );
        }

        return {
            eventType: payload.eventType,
            eventData: payload.eventData
        };
    }

    /**
     * Verify and validate a webhook request.
     *
     * rawBody must be the exact original HTTP request bytes.
     */
    verifyAndParse(rawBody, signature) {
        if (!this.verifySignature(rawBody, signature)) {
            const error = new Error(
                'Invalid Monnify webhook signature.'
            );

            error.statusCode = 401;

            throw error;
        }

        let payload;

        try {
            payload = JSON.parse(rawBody.toString('utf8'));
        } catch {
            const error = new Error(
                'Monnify webhook contains invalid JSON.'
            );

            error.statusCode = 400;

            throw error;
        }

        return this.validatePayload(payload);
    }

    /**
     * Process a verified webhook using an injected handler.
     *
     * The handler should perform database-backed idempotency
     * and reconciliation. Never credit a wallet merely because
     * a webhook body claims a transaction succeeded.
     */
    async handle(rawBody, signature, handler) {
        if (typeof handler !== 'function') {
            throw new Error(
                'A verified webhook handler is required.'
            );
        }

        const event = this.verifyAndParse(
            rawBody,
            signature
        );

        return handler(event);
    }
}

module.exports = MonnifyWalletWebhook;
