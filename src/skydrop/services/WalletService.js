'use strict';

const mongoose = require('mongoose');
const walletRepository = require('../repositories/WalletRepository');

const SUPPORTED_CURRENCIES = ['SKD', 'USD', 'NGN'];

class WalletService {
    normalizeCurrency(currency) {
        const normalized = String(currency || '').toUpperCase();

        if (!SUPPORTED_CURRENCIES.includes(normalized)) {
            const error = new Error('Unsupported wallet currency.');
            error.code = 'UNSUPPORTED_CURRENCY';
            throw error;
        }

        return normalized;
    }

    validateUserId(userId) {
        if (!mongoose.isValidObjectId(userId)) {
            const error = new Error('Invalid authenticated user.');
            error.code = 'INVALID_USER';
            throw error;
        }
    }

    async getWallet(userId, currency) {
        this.validateUserId(userId);

        const normalizedCurrency = this.normalizeCurrency(currency);

        const wallet = await walletRepository.findByUserAndCurrency(
            userId,
            normalizedCurrency
        );

        if (!wallet) {
            const error = new Error('Wallet not found.');
            error.code = 'WALLET_NOT_FOUND';
            throw error;
        }

        return {
            id: wallet._id,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            status: wallet.status
        };
    }

    async getWallets(userId) {
        this.validateUserId(userId);

        const wallets = await walletRepository.listByUser(userId);

        return wallets.map((wallet) => ({
            id: wallet._id,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            status: wallet.status
        }));
    }
}

module.exports = new WalletService();
module.exports.WalletService = WalletService;
