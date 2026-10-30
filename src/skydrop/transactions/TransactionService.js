'use strict';

const {
    SkyDropTransaction
} = require('../database/mongoose');

class TransactionService {
    static async getByReference(reference) {
        if (!reference) {
            throw new Error('Transaction reference is required.');
        }

        return SkyDropTransaction.findOne({
            reference
        }).lean();
    }

    static async getUserTransactions(userId, options = {}) {
        const page = Math.max(
            1,
            Number.parseInt(options.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(options.limit, 10) || 20)
        );

        const filter = {
            userId
        };

        if (options.type) {
            filter.type = options.type;
        }

        if (options.status) {
            filter.status = options.status;
        }

        const [transactions, total] = await Promise.all([
            SkyDropTransaction.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            SkyDropTransaction.countDocuments(filter)
        ]);

        return {
            transactions: transactions.map(transaction => ({
                id: String(transaction._id),
                reference: transaction.reference,
                type: transaction.type,
                asset: transaction.asset,
                amount: transaction.amount.toString(),
                status: transaction.status,
                description: transaction.description,
                metadata: transaction.metadata,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt
            })),

            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getTransaction(userId, reference) {
        const transaction = await SkyDropTransaction.findOne({
            userId,
            reference
        }).lean();

        if (!transaction) {
            throw new Error('Transaction not found.');
        }

        return {
            id: String(transaction._id),
            reference: transaction.reference,
            type: transaction.type,
            asset: transaction.asset,
            amount: transaction.amount.toString(),
            status: transaction.status,
            description: transaction.description,
            metadata: transaction.metadata,
            createdAt: transaction.createdAt,
            completedAt: transaction.completedAt
        };
    }
}

module.exports = TransactionService;
