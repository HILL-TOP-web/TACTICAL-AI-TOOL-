'use strict';

const WalletService = require('./WalletService');

const TransactionRepository =
    require('../repositories/TransactionRepository');

async function getDashboard(userId) {
    const [wallet, recentTransactions, transactionCount] =
        await Promise.all([
            WalletService.getWallet(userId),
            TransactionRepository.findRecent(userId, 5),
            TransactionRepository.countByUser(userId)
        ]);

    return {
        wallet,
        transactionCount,
        recentTransactions: recentTransactions.map((transaction) => ({
            id: String(transaction._id),
            reference: transaction.reference,
            type: transaction.type,
            amount: transaction.amount.toString(),
            currency: transaction.currency,
            status: transaction.status,
            description: transaction.description,
            createdAt: transaction.createdAt
        }))
    };
}

module.exports = {
    getDashboard
};
