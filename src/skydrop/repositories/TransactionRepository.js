'use strict';

const Transaction = require('../database/models/Transaction');

class TransactionRepository {
    async listForUser(userId, page = 1, limit = 20) {
        const filter = { userId };

        const [items, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Transaction.countDocuments(filter)
        ]);

        return {
            items,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        };
    }

    async recentForUser(userId, limit = 10) {
        return Transaction.find({ userId })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean();
    }
}

module.exports = new TransactionRepository();
