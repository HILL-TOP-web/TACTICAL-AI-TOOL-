'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

function createDepositRouter({
    depositService,
    requireAuth,
    logger = console
}) {
    if (
        !depositService ||
        typeof depositService.createDeposit !== 'function'
    ) {
        throw new Error(
            'DepositService.createDeposit is required.'
        );
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Deposit authentication middleware is required.'
        );
    }

    const router = express.Router();

    router.use(requireAuth);

    // POST /api/deposits
    router.post('/', async (req, res, next) => {
        try {
            const userId = req.user?._id || req.user?.id;

            if (!userId) {
                throw new AppError(
                    'Authentication required.',
                    401,
                    'UNAUTHENTICATED'
                );
            }

            const idempotencyKey =
                req.get('Idempotency-Key');

            if (
                typeof idempotencyKey !== 'string' ||
                !/^[a-zA-Z0-9._:-]{16,128}$/.test(idempotencyKey)
            ) {
                throw new AppError(
                    'A valid Idempotency-Key header is required.',
                    400,
                    'INVALID_IDEMPOTENCY_KEY'
                );
            }

            const result = await depositService.createDeposit({
                userId,
                amount: req.body.amount,
                currency: req.body.currency || 'NGN',
                idempotencyKey,
                requestId: req.requestId
            });

            return res.status(201).json({
                success: true,
                message: 'Deposit request created.',
                data: result,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Deposit creation failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    return router;
}

module.exports = createDepositRouter;
