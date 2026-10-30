'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

function createMiningRouter({
    miningService,
    requireAuth,
    logger = console
}) {
    if (!miningService || typeof miningService.getMiningState !== 'function') {
        throw new Error('MiningService.getMiningState is required.');
    }

    if (typeof requireAuth !== 'function') {
        throw new Error('Mining authentication middleware is required.');
    }

    const router = express.Router();

    router.use(requireAuth);

    // GET /api/mining
    router.get('/', async (req, res, next) => {
        try {
            const userId = req.user?._id || req.user?.id;

            if (!userId) {
                throw new AppError(
                    'Authentication required.',
                    401,
                    'UNAUTHENTICATED'
                );
            }

            const miningState =
                await miningService.getMiningState(userId);

            return res.status(200).json({
                success: true,
                data: miningState,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Mining state retrieval failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    return router;
}

module.exports = createMiningRouter;
