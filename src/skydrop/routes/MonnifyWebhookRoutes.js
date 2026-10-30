'use strict';

const express = require('express');

function createMonnifyWebhookRouter({
    monnifyWebhookService,
    webhookValidator,
    logger = console
}) {
    if (
        !monnifyWebhookService ||
        typeof monnifyWebhookService.processEvent !== 'function'
    ) {
        throw new Error(
            'MonnifyWebhookService.processEvent is required.'
        );
    }

    if (
        !webhookValidator ||
        typeof webhookValidator.validate !== 'function'
    ) {
        throw new Error(
            'MonnifyWebhookValidator.validate is required.'
        );
    }

    const router = express.Router();

    // IMPORTANT:
    // Mount this route with express.raw() before express.json().
    // The validator must verify the original raw request body.

    router.post(
        '/',
        express.raw({
            type: 'application/json',
            limit: '1mb'
        }),
        async (req, res, next) => {
            try {
                if (!Buffer.isBuffer(req.body)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Raw webhook body required.'
                    });
                }

                const validation =
                    await webhookValidator.validate({
                        rawBody: req.body,
                        headers: req.headers
                    });

                if (!validation || validation.valid !== true) {
                    logger.warn?.(
                        'Invalid Monnify webhook received',
                        {
                            requestId: req.requestId
                        }
                    );

                    return res.status(401).json({
                        success: false,
                        error: 'Webhook authentication failed.'
                    });
                }

                let event;

                try {
                    event = JSON.parse(req.body.toString('utf8'));
                } catch {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid webhook JSON.'
                    });
                }

                const result =
                    await monnifyWebhookService.processEvent({
                        event,
                        eventId: validation.eventId || null,
                        requestId: req.requestId
                    });

                return res.status(200).json({
                    success: true,
                    received: true,
                    processed: result?.processed === true,
                    requestId: req.requestId
                });

            } catch (error) {
                logger.error?.('Monnify webhook processing failed', {
                    requestId: req.requestId,
                    error: error.message
                });

                next(error);
            }
        }
    );

    return router;
}

module.exports = createMonnifyWebhookRouter;
