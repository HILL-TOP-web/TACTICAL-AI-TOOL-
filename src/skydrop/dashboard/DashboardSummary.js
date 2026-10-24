'use strict';

class DashboardSummary {
    build(data = {}) {
        const user = data.user || {};
        const wallet = data.wallet || {};
        const mining = data.mining || {};
        const transactions = Array.isArray(data.transactions)
            ? data.transactions
            : [];
        const rewards = data.rewards || {};

        return {
            profile: {
                userId: user.id || null,
                username: user.username || null,
                displayName: user.displayName || null,
                avatar: user.avatar || null,
                accountStatus: user.accountStatus || 'unknown'
            },

            wallet: {
                available: wallet.available === true,
                balance: wallet.balance ?? null,
                currency: wallet.currency || 'SKD'
            },

            mining: {
                available: mining.available === true,
                status: mining.status || 'unavailable',
                pendingAmount: mining.pendingAmount ?? null,
                currency: mining.currency || 'SKD',
                multiplier: mining.multiplier ?? null
            },

            rewards: {
                available: rewards.available === true,
                total: rewards.total ?? null,
                currency: rewards.currency || 'SKD'
            },

            recentTransactions: transactions.slice(0, 5).map(
                transaction => ({
                    id: transaction.id || null,
                    type: transaction.type || 'unknown',
                    status: transaction.status || 'unknown',
                    amount: transaction.amount ?? null,
                    currency: transaction.currency || null,
                    createdAt: transaction.createdAt || null
                })
            )
        };
    }
}

module.exports = DashboardSummary;
