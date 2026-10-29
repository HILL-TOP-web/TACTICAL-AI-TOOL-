'use strict';

const dashboardService = require('../../services/DashboardService');
const walletService = require('../../services/WalletService');
const transactionService = require('../../services/TransactionService');
const transferService = require('../../services/TransferService');
const withdrawalService = require('../../services/WithdrawalService');

const { asyncHandler } = require('../utils/httpError');

function getUserId(req) {
    return req.user.id || req.user._id;
}

module.exports = {
    dashboard: asyncHandler(async (req, res) => {
        const data = await dashboardService.getSummary(
            getUserId(req)
        );

        return res.json({
            success: true,
            data
        });
    }),

    wallet: asyncHandler(async (req, res) => {
        const data = await walletService.getWallet(
            getUserId(req)
        );

        return res.json({
            success: true,
            data
        });
    }),

    transactions: asyncHandler(async (req, res) => {
        const data = await transactionService.list(
            getUserId(req),
            req.query
        );

        return res.json({
            success: true,
            data
        });
    }),

    transfers: asyncHandler(async (req, res) => {
        const data = await transferService.list(
            getUserId(req),
            req.query
        );

        return res.json({
            success: true,
            data
        });
    }),

    createTransfer: asyncHandler(async (req, res) => {
        const data = await transferService.create(
            getUserId(req),
            req.body
        );

        return res.status(202).json({
            success: true,
            data
        });
    }),

    withdrawals: asyncHandler(async (req, res) => {
        const data = await withdrawalService.list(
            getUserId(req),
            req.query
        );

        return res.json({
            success: true,
            data
        });
    }),

    createWithdrawal: asyncHandler(async (req, res) => {
        const data = await withdrawalService.create(
            getUserId(req),
            req.body
        );

        return res.status(202).json({
            success: true,
            data
        });
    })
};
