'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

function createTransactionRouter({
    transactionHistoryService,
    requireAuth,
    logger = console
}) {
    if (
        !transactionHistoryService ||
        typeof transactionHistoryService.getHistory !== 'function' ||
        typeof transactionHistoryService.getTransactionById !== 'function'
    ) {
        throw new Error(
            'TransactionHistoryService must implement getHistory and getTransactionById.'
        );
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Transaction authentication middleware is required.'
        );
    }

    const router = express.Router();

    router.use(requireAuth);

    // GET /api/transactions
    router.get('/', async (req, res, next) => {
        try {
            const userId =
                req.user?._id || req.user?.id;

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
                await transactionHistoryService.getHistory({
                    userId,
                    page,
                    limit,
                    type: req.query.type || null,
                    status: req.query.status || null
                });

            return res.status(200).json({
                success: true,
                data: history,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Transaction history retrieval failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    // GET /api/transactions/:id
    router.get('/:id', async (req, res, next) => {
        try {
            const userId =
                req.user?._id || req.user?.id;

            if (!userId) {
                throw new AppError(
                    'Authentication required.',
                    401,
                    'UNAUTHENTICATED'
                );
            }

            const transactionId = req.params.id;

            if (
                typeof transactionId !== 'string' ||
                !/^[a-fA-F0-9]{24}$/.test(transactionId)
            ) {
                throw new AppError(
                    'Invalid transaction identifier.',
                    400,
                    'INVALID_TRANSACTION_ID'
                );
            }

            const transaction =
                await transactionHistoryService.getTransactionById({
                    userId,
                    transactionId
                });

            if (!transaction) {
                throw new AppError(
                    'Transaction not found.',
                    404,
                    'TRANSACTION_NOT_FOUND'
                );
            }

            return res.status(200).json({
                success: true,
                data: transaction,
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Transaction retrieval failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    return router;
}

module.exports = createTransactionRouter;
