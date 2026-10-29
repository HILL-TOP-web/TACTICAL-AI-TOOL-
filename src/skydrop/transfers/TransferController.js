'use strict';

const express = require('express');

const transferService = require('../services/TransferService');
const transactionService = require('../services/TransactionService');

const router = express.Router();

function getAuthenticatedUserId(req) {
    const userId = req.user && (req.user.id || req.user._id);

    if (!userId) {
        const error = new Error('Authentication is required.');
        error.code = 'UNAUTHENTICATED';
        error.statusCode = 401;
        throw error;
    }

    return userId;
}

function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

function getStatusCode(error) {
    if (error.statusCode) {
        return error.statusCode;
    }

    const statusMap = {
        UNAUTHENTICATED: 401,
        INVALID_USER: 400,
        INVALID_SENDER: 400,
        INVALID_RECIPIENT: 400,
        INVALID_AMOUNT: 400,
        INVALID_AMOUNT_PRECISION: 400,
        INVALID_REFERENCE: 400,
        INVALID_IDEMPOTENCY_KEY: 400,
        UNSUPPORTED_CURRENCY: 400,
        SELF_TRANSFER: 400,
        SAME_WALLET: 400,
        IDEMPOTENCY_CONFLICT: 409,
        INSUFFICIENT_FUNDS: 409,
        WALLET_NOT_ACTIVE: 409,
        TRANSFER_NOT_COMPLETED: 409,
        SENDER_WALLET_NOT_FOUND: 404,
        RECIPIENT_WALLET_NOT_FOUND: 404,
        WALLET_NOT_FOUND: 404,
        TRANSACTION_NOT_FOUND: 404,
        TRANSFER_NOT_FOUND: 404
    };

    return statusMap[error.code] || 500;
}

/**
 * POST /api/transfers
 *
 * Body:
 * {
 *   "recipientUserId": "...",
 *   "currency": "SKD",
 *   "amount": "10.00000000",
 *   "description": "Internal transfer"
 * }
 *
 * Header:
 * Idempotency-Key: a-unique-request-key
 */
router.post(
    '/',
    asyncHandler(async (req, res) => {
        const senderUserId = getAuthenticatedUserId(req);

        const {
            recipientUserId,
            currency,
            amount,
            description
        } = req.body || {};

        const idempotencyKey =
            req.get('Idempotency-Key') || null;

        const result = await transferService.transfer({
            senderUserId,
            recipientUserId,
            currency,
            amount,
            description,
            idempotencyKey
        });

        return res.status(200).json(result);
    })
);

/**
 * GET /api/transfers
 *
 * Returns the authenticated user's transaction history.
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const userId = getAuthenticatedUserId(req);

        const history = await transferService.getHistory(userId, {
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json({
            success: true,
            ...history
        });
    })
);

/**
 * GET /api/transfers/:reference
 *
 * Returns a transfer only to its sender or recipient.
 */
router.get(
    '/:reference',
    asyncHandler(async (req, res) => {
        const userId = getAuthenticatedUserId(req);

        const transaction = await transactionService.getTransaction(
            userId,
            req.params.reference
        );

        return res.status(200).json({
            success: true,
            transaction
        });
    })
);

/**
 * Error middleware for this router.
 */
router.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = getStatusCode(error);

    if (statusCode >= 500) {
        console.error('SkyDrop transfer error:', {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message
        });
    }

    return res.status(statusCode).json({
        success: false,
        error: statusCode >= 500
            ? 'An internal error occurred.'
            : error.message,
        code: error.code || 'INTERNAL_ERROR'
    });
});

module.exports = router;
module.exports.getAuthenticatedUserId = getAuthenticatedUserId;
