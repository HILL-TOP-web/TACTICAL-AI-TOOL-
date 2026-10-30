'use strict';

const express = require('express');

const { AppError } = require('../middleware/errorHandler');

const TRADING_START_DATE =
    new Date('2027-01-01T10:00:00+01:00');

function isTradingEnabled() {
    return Date.now() >= TRADING_START_DATE.getTime();
}

function tradingLock(req, res, next) {
    if (!isTradingEnabled()) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'TRADING_DISABLED',
                message:
                    'TRADING STARTS ON THE 1st OF JANUARY 2027 AT 10:00 AM',
                tradingStartDate:
                    TRADING_START_DATE.toISOString()
            },
            requestId: req.requestId
        });
    }

    next();
}

function createExchangeRouter({
    exchangeService,
    requireAuth,
    logger = console
}) {
    if (!exchangeService) {
        throw new Error('ExchangeService is required.');
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Exchange authentication middleware is required.'
        );
    }

    const router = express.Router();

    // GET /api/exchange
    router.get('/', requireAuth, async (req, res, next) => {
        try {
            if (
                typeof exchangeService.getExchangeStatus !== 'function'
            ) {
                throw new Error(
                    'ExchangeService.getExchangeStatus is required.'
                );
            }

            const status =
                await exchangeService.getExchangeStatus();

            return res.status(200).json({
                success: true,
                data: {
                    ...status,
                    tradingEnabled: isTradingEnabled(),
                    tradingStartDate:
                        TRADING_START_DATE.toISOString()
                },
                requestId: req.requestId
            });

        } catch (error) {
            logger.error?.('Exchange status failed', {
                requestId: req.requestId,
                error: error.message
            });

            next(error);
        }
    });

    // POST /api/exchange
    router.post(
        '/',
        requireAuth,
        tradingLock,
        async (req, res, next) => {
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

                if (
                    typeof exchangeService.executeExchange !== 'function'
                ) {
                    throw new Error(
                        'ExchangeService.executeExchange is required.'
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

                const result =
                    await exchangeService.executeExchange({
                        userId,
                        fromCurrency: req.body.fromCurrency,
                        toCurrency: req.body.toCurrency,
                        amount: req.body.amount,
                        idempotencyKey,
                        requestId: req.requestId
                    });

                return res.status(200).json({
                    success: true,
                    data: result,
                    requestId: req.requestId
                });

            } catch (error) {
                logger.error?.('Exchange execution failed', {
                    requestId: req.requestId,
                    error: error.message
                });

                next(error);
            }
        }
    );

    return router;
}

module.exports = {
    createExchangeRouter,
    isTradingEnabled,
    TRADING_START_DATE
};
