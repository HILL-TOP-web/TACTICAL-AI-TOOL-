'use strict';

const Transfer = require('../database/models/Transfer');

class TransferRepository {
    async listForUser(userId, page = 1, limit = 20) {
        const filter = { userId };

        const [items, total] = await Promise.all([
            Transfer.find(filter)
                .select('-recipientAccountNumber -recipientBankCode -providerReference')
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Transfer.countDocuments(filter)
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

module.exports = new TransferRepository();
