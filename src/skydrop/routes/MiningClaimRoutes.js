'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

function createMiningClaimRouter({
    miningService,
    requireAuth,
    logger = console
}) {
    if (
        !miningService ||
        typeof miningService.claimReward !== 'function'
    ) {
        throw new Error(
            'MiningService.claimReward is required.'
        );
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Mining authentication middleware is required.'
        );
    }

    const router = express.Router();

    router.use(requireAuth);

    // POST /api/mining/claim
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

            // The client cannot submit or determine the reward amount.
            const result = await miningService.claimReward({
                userId,
                idempotencyKey,
                requestId: req.requestId
            });

            return res.status(200).json({
                success: true,
                message: 'Mining claim processed.',
                data: result,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Mining reward claim failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    return router;
}

module.exports = createMiningClaimRouter;
