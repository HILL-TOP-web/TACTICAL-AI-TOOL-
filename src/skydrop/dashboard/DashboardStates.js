'use strict';

class DashboardStats {
    calculate(data = {}) {
        const transactions = Array.isArray(data.transactions)
            ? data.transactions
            : [];

        const wallet = data.wallet || {};
        const mining = data.mining || {};
        const rewards = data.rewards || {};

        const successfulTransactions = transactions.filter(
            transaction =>
                String(transaction.status).toLowerCase() ===
                'completed'
        );

        const pendingTransactions = transactions.filter(
            transaction =>
                String(transaction.status).toLowerCase() ===
                'pending'
        );

        const failedTransactions = transactions.filter(
            transaction =>
                String(transaction.status).toLowerCase() ===
                'failed'
        );

        return {
            wallet: {
                available: wallet.available === true,
                balance: wallet.balance ?? null,
                currency: wallet.currency || 'SKD'
            },

            mining: {
                available: mining.available === true,
                active: mining.status === 'active',
                pendingAmount: mining.pendingAmount ?? null,
                currency: mining.currency || 'SKD'
            },

            rewards: {
                available: rewards.available === true,
                total: rewards.total ?? null,
                currency: rewards.currency || 'SKD'
            },

            transactions: {
                recentCount: transactions.length,
                completedCount: successfulTransactions.length,
                pendingCount: pendingTransactions.length,
                failedCount: failedTransactions.length
            }
        };
    }
}

module.exports = DashboardStats;
