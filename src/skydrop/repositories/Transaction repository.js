'use strict';

const Transaction = require('../models/Transaction');

async function findPage(userId, page, limit) {
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
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

async function findRecent(userId, limit = 5) {
    return Transaction.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .lean();
}

async function countByUser(userId) {
    return Transaction.countDocuments({ userId });
}

module.exports = {
    findPage,
    findRecent,
    countByUser
};
