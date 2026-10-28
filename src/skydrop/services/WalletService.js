'use strict';

const WalletRepository = require('../repositories/WalletRepository');

async function getWallet(userId) {
    const wallet = await WalletRepository.findByUserId(userId);

    if (!wallet) {
        return {
            userId,
            skdBalance: '0',
            usdBalance: '0',
            usdtBalance: '0',
            ngnBalance: '0'
        };
    }

    return {
        userId: String(wallet.userId),
        skdBalance: wallet.skdBalance?.toString() ?? '0',
        usdBalance: wallet.usdBalance?.toString() ?? '0',
        usdtBalance: wallet.usdtBalance?.toString() ?? '0',
        ngnBalance: wallet.ngnBalance?.toString() ?? '0'
    };
}

module.exports = {
    getWallet
};
