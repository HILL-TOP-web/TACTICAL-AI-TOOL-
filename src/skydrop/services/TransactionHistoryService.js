'use strict';

const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const LedgerEntry = require('../models/LedgerEntry');
const Transfer = require('../models/Transfer');
const Withdrawal = require('../models/Withdrawal');
const Deposit = require('../models/Deposit');

class TransactionHistoryService {
    validateUserId(userId) {
        if (
            !userId ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            throw new Error('A valid user ID is required.');
        }
    }

    normalizePagination(page, limit) {
        const safePage = Math.max(
            1,
            Number.parseInt(page, 10) || 1
        );

        const safeLimit = Math.min(
            100,
            Math.max(
                1,
                Number.parseInt(limit, 10) || 20
            )
        );

        return {
            page: safePage,
            limit: safeLimit
        };
    }

    buildTransactionFilter(userId, filters = {}) {
        const query = {
            userId
        };

        if (filters.status) {
            const allowedStatuses = [
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'reversed'
            ];

            if (!allowedStatuses.includes(filters.status)) {
                throw new Error('Invalid transaction status filter.');
            }

            query.status = filters.status;
        }

        if (filters.type) {
            const allowedTypes = [
                'deposit',
                'withdrawal',
                'transfer',
                'conversion',
                'mining_reward',
                'task_reward',
                'refund',
                'adjustment'
            ];

            if (!allowedTypes.includes(filters.type)) {
                throw new Error('Invalid transaction type filter.');
            }

            query.type = filters.type;
        }

        if (filters.currency) {
            const currency = String(filters.currency).toUpperCase();

            if (!['NGN', 'USD', 'USDT', 'SKD'].includes(currency)) {
                throw new Error('Invalid currency filter.');
            }

            query.currency = currency;
        }

        if (filters.from || filters.to) {
            query.createdAt = {};

            if (filters.from) {
                const from = new Date(filters.from);

                if (Number.isNaN(from.getTime())) {
                    throw new Error('Invalid start date.');
                }

                query.createdAt.$gte = from;
            }

            if (filters.to) {
                const to = new Date(filters.to);

                if (Number.isNaN(to.getTime())) {
                    throw new Error('Invalid end date.');
                }

                query.createdAt.$lte = to;
            }

            if (
                query.createdAt.$gte &&
                query.createdAt.$lte &&
                query.createdAt.$gte > query.createdAt.$lte
            ) {
                throw new Error(
                    'Start date must not be later than end date.'
                );
            }
        }

        return query;
    }

    async getTransactionHistory(userId, filters = {}) {
        this.validateUserId(userId);

        const {
            page,
            limit
        } = this.normalizePagination(
            filters.page,
            filters.limit
        );

        const query = this.buildTransactionFilter(
            userId,
            filters
        );

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({
                    createdAt: -1,
                    _id: -1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Transaction.countDocuments(query)
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getTransactionById(userId, transactionId) {
        this.validateUserId(userId);

        if (!transactionId) {
            throw new Error('Transaction ID is required.');
        }

        return Transaction.findOne({
            userId,
            $or: [
                {
                    transactionId
                },
                ...(mongoose.Types.ObjectId.isValid(transactionId)
                    ? [{ _id: transactionId }]
                    : [])
            ]
        }).lean();
    }

    async getLedgerHistory(userId, filters = {}) {
        this.validateUserId(userId);

        const {
            page,
            limit
        } = this.normalizePagination(
            filters.page,
            filters.limit
        );

        const query = {
            userId
        };

        if (filters.currency) {
            query.currency = String(
                filters.currency
            ).toUpperCase();
        }

        const [entries, total] = await Promise.all([
            LedgerEntry.find(query)
                .sort({
                    createdAt: -1,
                    _id: -1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            LedgerEntry.countDocuments(query)
        ]);

        return {
            entries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getDeposits(userId, filters = {}) {
        this.validateUserId(userId);

        const {
            page,
            limit
        } = this.normalizePagination(
            filters.page,
            filters.limit
        );

        const query = {
            userId
        };

        if (filters.status) {
            query.status = filters.status;
        }

        const [deposits, total] = await Promise.all([
            Deposit.find(query)
                .sort({
                    createdAt: -1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Deposit.countDocuments(query)
        ]);

        return {
            deposits,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getWithdrawals(userId, filters = {}) {
        this.validateUserId(userId);

        const {
            page,
            limit
        } = this.normalizePagination(
            filters.page,
            filters.limit
        );

        const query = {
            userId
        };

        if (filters.status) {
            query.status = filters.status;
        }

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(query)
                .sort({
                    createdAt: -1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Withdrawal.countDocuments(query)
        ]);

        return {
            withdrawals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getTransfers(userId, filters = {}) {
        this.validateUserId(userId);

        const {
            page,
            limit
        } = this.normalizePagination(
            filters.page,
            filters.limit
        );

        const query = {
            $or: [
                {
                    senderUserId: userId
                },
                {
                    recipientUserId: userId
                }
            ]
        };

        if (filters.status) {
            query.status = filters.status;
        }

        const [transfers, total] = await Promise.all([
            Transfer.find(query)
                .sort({
                    createdAt: -1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Transfer.countDocuments(query)
        ]);

        return {
            transfers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = new TransactionHistoryService();
module.exports.TransactionHistoryService =
    TransactionHistoryService;
