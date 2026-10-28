'use strict';

const crypto = require('node:crypto');

const {
    getMonnifyConfig
} = require('./MonnifyConfig');

function verifyMonnifyWebhook({
    rawBody,
    signature,
    secretKey
}) {
    if (
        rawBody === undefined ||
        rawBody === null ||
        !signature ||
        !secretKey
    ) {
        return false;
    }

    const raw = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(String(rawBody));

    const expected = crypto
        .createHash('sha512')
        .update(String(secretKey) + raw.toString('utf8'))
        .digest('hex');

    const supplied = String(signature)
        .trim()
        .toLowerCase();

    if (!/^[a-f0-9]{128}$/.test(supplied)) {
        return false;
    }

    const expectedBuffer = Buffer.from(expected, 'hex');
    const suppliedBuffer = Buffer.from(supplied, 'hex');

    return (
        expectedBuffer.length === suppliedBuffer.length &&
        crypto.timingSafeEqual(
            expectedBuffer,
            suppliedBuffer
        )
    );
}

function createMonnifyWalletWebhook({
    transactionService,
    withdrawalRepository,
    transferRepository,
    env = process.env
}) {
    if (!transactionService) {
        throw new Error(
            'transactionService is required.'
        );
    }

    return async function monnifyWalletWebhook(
        req,
        res,
        next
    ) {
        try {
            const config = getMonnifyConfig(env);

            const rawBody =
                req.rawBody || req.bodyRaw;

            const signature =
                req.get('monnify-signature');

            const valid = verifyMonnifyWebhook({
                rawBody,
                signature,
                secretKey: config.secretKey
            });

            if (!valid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid Monnify webhook signature.'
                });
            }

            const event = req.body || {};
            const eventType = String(
                event.eventType || ''
            ).toUpperCase();

            const data = event.eventData || {};

            const reference =
                data.reference ||
                data.transactionReference ||
                data.paymentReference;

            if (!reference) {
                return res.status(400).json({
                    success: false,
                    error: 'Webhook reference is missing.'
                });
            }

            if (eventType.includes('DISBURSEMENT')) {
                let status = 'UNKNOWN';

                if (eventType.includes('SUCCESSFUL')) {
                    status = 'SUCCESS';
                } else if (eventType.includes('FAILED')) {
                    status = 'FAILED';
                } else if (eventType.includes('REVERSED')) {
                    status = 'REVERSED';
                }

                const fields = {
                    providerStatus: eventType,
                    providerTransactionReference:
                        data.transactionReference || null,
                    providerEvent: eventType,
                    providerEventData: data,
                    providerUpdatedAt: new Date()
                };

                if (
                    withdrawalRepository &&
                    typeof withdrawalRepository
                        .updateByProviderReference === 'function'
                ) {
                    await withdrawalRepository
                        .updateByProviderReference(
                            reference,
                            status,
                            fields
                        );
                }

                if (
                    transferRepository &&
                    typeof transferRepository
                        .updateByProviderReference === 'function'
                ) {
                    await transferRepository
                        .updateByProviderReference(
                            reference,
                            status,
                            fields
                        );
                }

                if (
                    typeof transactionService
                        .updateByProviderReference === 'function'
                ) {
                    await transactionService
                        .updateByProviderReference(
                            reference,
                            status,
                            fields
                        );
                }
            } else if (
                eventType === 'SUCCESSFUL_TRANSACTION' &&
                typeof transactionService
                    .recordFundingNotification === 'function'
            ) {
                await transactionService
                    .recordFundingNotification({
                        reference,
                        eventData: data
                    });
            }

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
    verifyMonnifyWebhook,
    createMonnifyWalletWebhook
};
