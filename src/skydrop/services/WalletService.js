'use strict';

const walletRepository = require('../repositories/WalletRepository');

module.exports = {
    async getWallet(userId) {
        const wallet = await walletRepository.ensureForUser(userId);

        return {
            id: wallet._id,
            userId: wallet.userId,
            currency: wallet.currency,
            availableBalance: wallet.availableBalance,
            pendingBalance: wallet.pendingBalance,
            lockedBalance: wallet.lockedBalance,
            status: wallet.status,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
        };
    }
};
