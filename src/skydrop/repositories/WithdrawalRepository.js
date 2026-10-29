'use strict';

const Withdrawal = require('../database/models/Withdrawal');

class WithdrawalRepository {
    async listForUser(userId, page = 1, limit = 20) {
        const filter = { userId };

        const [items, total] = await Promise.all([
            Withdrawal.find(filter)
                .select(
                    '-recipientAccountNumber -providerReference'
                )
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Withdrawal.countDocuments(filter)
        ]);

        return {
            items,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        };
    }
}

module.exports = new WithdrawalRepository();
