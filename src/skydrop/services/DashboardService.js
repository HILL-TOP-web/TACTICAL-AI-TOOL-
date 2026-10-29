'use strict';

const walletService = require('./WalletService');

const transactionRepository = require('../repositories/TransactionRepository');

const Transfer = require('../database/models/Transfer');
const Withdrawal = require('../database/models/Withdrawal');

module.exports = {
    async getSummary(userId) {
        const [
            wallet,
            recentTransactions,
            transferCount,
            withdrawalCount
        ] = await Promise.all([
            walletService.getWallet(userId),

            transactionRepository.recentForUser(userId, 10),

            Transfer.countDocuments({ userId }),

            Withdrawal.countDocuments({ userId })
        ]);

        return {
            wallet,

            recentTransactions,

            counts: {
                transfers: transferCount,
                withdrawals: withdrawalCount
            }
        };
    }
};
