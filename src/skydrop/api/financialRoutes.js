'use strict';

const express = require('express');

function createFinancialRouter({
    requireAuth,
    transferRouter,
    miningService,
    exchangeService
}) {
    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Authentication middleware is required.'
        );
    }

    if (!transferRouter || !miningService || !exchangeService) {
        throw new Error(
            'Transfer, mining and exchange services are required.'
        );
    }

    const router = express.Router();

    router.use('/transfers', transferRouter);

    router.post(
        '/mining/start',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await miningService.startMining(
                        req.user.id
                    );

                return res.status(201).json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.post(
        '/mining/:sessionId/claim',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await miningService.claimMiningReward(
                        req.user.id,
                        req.params.sessionId
                    );

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.post(
        '/mining/:sessionId/stop',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await miningService.stopMining(
                        req.user.id,
                        req.params.sessionId
                    );

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.get(
        '/mining/session',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await miningService.getActiveSession(
                        req.user.id
                    );

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.post(
        '/exchange/orders',
        requireAuth,
        async (req, res, next) => {
            try {
                const {
                    side,
                    asset,
                    amount
                } = req.body || {};

                const result =
                    await exchangeService.placeOrder({
                        userId: req.user.id,
                        side,
                        asset,
                        amount
                    });

                return res.status(202).json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.get(
        '/exchange/orders',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await exchangeService.listOrders(
                        req.user.id,
                        req.query.limit
                    );

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.get(
        '/exchange/orders/:reference',
        requireAuth,
        async (req, res, next) => {
            try {
                const result =
                    await exchangeService.getOrder(
                        req.params.reference,
                        req.user.id
                    );

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        error: 'Exchange order not found.'
                    });
                }

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.get(
        '/exchange/estimate/skd',
        requireAuth,
        async (req, res, next) => {
            try {
                const amount = Number(req.query.amount);

                if (
                    !Number.isFinite(amount) ||
                    amount < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid SKD amount.'
                    });
                }

                const result =
                    await exchangeService.estimateSkdValue(
                        amount
                    );

                return res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    return router;
}

module.exports = {
    createFinancialRouter
};
