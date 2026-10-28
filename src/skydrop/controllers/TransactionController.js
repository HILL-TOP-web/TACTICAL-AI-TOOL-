'use strict';

const mongoose = require('mongoose');

const TransactionService =
    require('../services/TransactionService');

async function getTransactions(req, res, next) {
    try {
        if (!mongoose.isValidObjectId(req.user.id)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authenticated user.'
            });
        }

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (
            !Number.isSafeInteger(page) ||
            !Number.isSafeInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: 'page must be positive and limit must be between 1 and 100.'
            });
        }

        const result = await TransactionService.getTransactions(
            req.user.id,
            page,
            limit
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getTransactions
};
