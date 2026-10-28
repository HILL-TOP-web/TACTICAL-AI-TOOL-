'use strict';

const Wallet = require('../models/Wallet');

async function findByUserId(userId) {
    return Wallet.findOne({ userId }).lean();
}

module.exports = {
    findByUserId
};
