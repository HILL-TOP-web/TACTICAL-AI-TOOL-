'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

function createDepositHistoryRouter({
    depositService,
    requireAuth,
    logger = console
}) {
    if (
        !depositService ||
        typeof depositService.getDepositHistory !== 'function'
    ) {
        throw new Error(
            'DepositService.getDepositHistory is required.'
        );
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Deposit authentication middleware is required.'
        );
    }

    const router = express.Router();

    router.use(requireAuth);

    // GET /api/deposits
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

            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);

            if (
                !Number.isSafeInteger(page) ||
                page < 1 ||
                !Number.isSafeInteger(limit) ||
                limit < 1 ||
                limit > 100
            ) {
                throw new AppError(
                    'Invalid pagination parameters.',
                    400,
                    'INVALID_PAGINATION'
                );
            }

            const history =
                await depositService.getDepositHistory({
                    userId,
                    page,
                    limit
                });

            return res.status(200).json({
                success: true,
                data: history,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Deposit history retrieval failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    return router;
}

module.exports = createDepositHistoryRouter;
