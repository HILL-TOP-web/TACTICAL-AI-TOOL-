'use strict';

const TransactionRepository =
    require('../repositories/TransactionRepository');

async function getTransactions(userId, page = 1, limit = 20) {
    return TransactionRepository.findPage(userId, page, limit);
}

module.exports = {
    getTransactions
};
