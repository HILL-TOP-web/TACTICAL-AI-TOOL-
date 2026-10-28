'use strict';

const Transfer = require('../models/Transfer');

async function findByUserId(userId) {
    return Transfer.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .lean();
}

async function create(data) {
    return Transfer.create(data);
}

module.exports = {
    findByUserId,
    create
};
