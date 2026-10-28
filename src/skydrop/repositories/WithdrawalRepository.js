'use strict';

const Withdrawal = require('../models/Withdrawal');

async function findByUserId(userId) {
    return Withdrawal.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .lean();
}

async function create(data) {
    return Withdrawal.create(data);
}

module.exports = {
    findByUserId,
    create
};
