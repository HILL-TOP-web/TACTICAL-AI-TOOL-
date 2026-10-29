'use strict';

const express = require('express');

function createTransferRouter({
    withdrawalService,
    requireAuth
}) {
    if (!withdrawalService) {
        throw new Error(
            'WithdrawalService is required.'
        );
    }

    if (typeof requireAuth !== 'function') {
        throw new Error(
            'Authentication middleware is required.'
        );
    }

    const router = express.Router();

    router.post(
        '/withdrawals',
        requireAuth,
        async (req, res, next) => {
            try {
                const {
                    amountNgn,
                    bankCode,
                    accountNumber,
                    accountName,
                    idempotencyKey
                } = req.body || {};

                const amount = Number(amountNgn);

                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid withdrawal amount.'
                    });
                }

                const result =
                    await withdrawalService.requestWithdrawal({
                        userId: req.user.id,
                        amountNgn: amount,
                        bankCode,
                        accountNumber,
                        accountName,
                        idempotencyKey
                    });

                return res.status(202).json({
                    success: true,
                    message:
                        'Withdrawal submitted for processing.',
                    data: result
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    router.get(
        '/withdrawals/:reference',
        requireAuth,
        async (req, res, next) => {
            try {
                const withdrawal =
                    await withdrawalService.getWithdrawal(
                        req.params.reference,
                        req.user.id
                    );

                if (!withdrawal) {
                    return res.status(404).json({
                        success: false,
                        error: 'Withdrawal not found.'
                    });
                }

                return res.json({
                    success: true,
                    data: withdrawal
                });
            } catch (error) {
                return next(error);
            }
        }
    );

    return router;
}

module.exports = {
    createTransferRouter
};
