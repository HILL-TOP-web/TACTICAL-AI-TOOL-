'use strict';

class DashboardService {
    constructor(options = {}) {
        this.repository = options.repository;
        this.summary = options.summary;
        this.stats = options.stats;

        this.walletService = options.walletService || null;
        this.miningService = options.miningService || null;
        this.transactionService =
            options.transactionService || null;
        this.rewardService = options.rewardService || null;

        if (!this.repository) {
            throw new TypeError(
                'DashboardRepository is required.'
            );
        }
    }

    async getDashboard(userId) {
        this._validateUserId(userId);

        const user = await this.repository.getUser(userId);

        if (!user) {
            const error = new Error(
                'Dashboard user was not found.'
            );
            error.statusCode = 404;
            throw error;
        }

        const [
            wallet,
            mining,
            transactions,
            rewards
        ] = await Promise.all([
            this._getWallet(userId),
            this._getMining(userId),
            this._getTransactions(userId),
            this._getRewards(userId)
        ]);

        const dashboardData = {
            user: {
                id: String(user.id),
                username: user.username || null,
                displayName: user.displayName || null,
                email: user.email || null,
                avatar: user.avatar || null,
                accountStatus: user.accountStatus || 'unknown',
                createdAt: user.createdAt || null
            },

            wallet,

            mining,

            transactions,

            rewards
        };

        const summary = this.summary
            ? this.summary.build(dashboardData)
            : dashboardData;

        const stats = this.stats
            ? this.stats.calculate(dashboardData)
            : {};

        return {
            success: true,
            generatedAt: new Date().toISOString(),
            summary,
            stats
        };
    }

    async getSummary(userId) {
        const dashboard = await this.getDashboard(userId);

        return dashboard.summary;
    }

    async getStats(userId) {
        const dashboard = await this.getDashboard(userId);

        return dashboard.stats;
    }

    async getTransactions(userId, options = {}) {
        this._validateUserId(userId);

        if (!this.transactionService) {
            return [];
        }

        if (
            typeof this.transactionService.getUserTransactions !==
            'function'
        ) {
            throw new Error(
                'Transaction service does not support getUserTransactions().'
            );
        }

        return this.transactionService.getUserTransactions(
            String(userId),
            options
        );
    }

    async _getWallet(userId) {
        if (!this.walletService) {
            return {
                available: false,
                balance: null,
                currency: 'SKD'
            };
        }

        if (
            typeof this.walletService.getBalance !== 'function'
        ) {
            throw new Error(
                'Wallet service does not support getBalance().'
            );
        }

        const result = await this.walletService.getBalance(
            String(userId)
        );

        return {
            available: true,
            balance: result.balance ?? null,
            currency: result.currency || 'SKD'
        };
    }

    async _getMining(userId) {
        if (!this.miningService) {
            return {
                available: false,
                status: 'unavailable',
                pendingAmount: null
            };
        }

        if (
            typeof this.miningService.getStatus !== 'function'
        ) {
            throw new Error(
                'Mining service does not support getStatus().'
            );
        }

        const result = await this.miningService.getStatus(
            String(userId)
        );

        return {
            available: true,
            status: result.status,
            pendingAmount: result.pendingAmount ?? null,
            currency: result.currency || 'SKD',
            multiplier: result.multiplier ?? null
        };
    }

    async _getTransactions(userId) {
        if (!this.transactionService) {
            return [];
        }

        if (
            typeof this.transactionService.getUserTransactions !==
            'function'
        ) {
            throw new Error(
                'Transaction service does not support getUserTransactions().'
            );
        }

        return this.transactionService.getUserTransactions(
            String(userId),
            {
                limit: 5,
                offset: 0
            }
        );
    }

    async _getRewards(userId) {
        if (!this.rewardService) {
            return {
                available: false,
                total: null,
                currency: 'SKD'
            };
        }

        if (
            typeof this.rewardService.getUserRewards !==
            'function'
        ) {
            throw new Error(
                'Reward service does not support getUserRewards().'
            );
        }

        const result = await this.rewardService.getUserRewards(
            String(userId)
        );

        return {
            available: true,
            total: result.total ?? 0,
            currency: result.currency || 'SKD'
        };
    }

    _validateUserId(userId) {
        if (
            userId === undefined ||
            userId === null ||
            String(userId).trim() === ''
        ) {
            throw new TypeError(
                'A valid user ID is required.'
            );
        }
    }
}

module.exports = DashboardService;
