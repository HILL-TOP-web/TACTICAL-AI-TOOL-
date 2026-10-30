'use strict';

const {
    mongoose,
    SkyDropWallet
} = require('../database/mongoose');

class WalletService {
    static async createWallet(userId) {
        const existingWallet = await SkyDropWallet.findOne({
            userId
        });

        if (existingWallet) {
            return existingWallet;
        }

        try {
            return await SkyDropWallet.create({
                userId,
                skdBalance: mongoose.Types.Decimal128.fromString('0'),
                usdBalance: mongoose.Types.Decimal128.fromString('0'),
                ngnBalance: mongoose.Types.Decimal128.fromString('0')
            });
        } catch (error) {
            if (error.code === 11000) {
                return SkyDropWallet.findOne({ userId });
            }

            throw error;
        }
    }

    static async getWallet(userId) {
        const wallet = await SkyDropWallet.findOne({
            userId
        }).lean();

        if (!wallet) {
            throw new Error('Wallet not found.');
        }

        return {
            id: String(wallet._id),
            userId: String(wallet.userId),
            skdBalance: wallet.skdBalance.toString(),
            usdBalance: wallet.usdBalance.toString(),
            ngnBalance: wallet.ngnBalance.toString(),
            currency: wallet.currency,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
        };
    }

    static async getSKDBalance(userId) {
        const wallet = await SkyDropWallet.findOne({
            userId
        }).select('skdBalance');

        if (!wallet) {
            throw new Error('Wallet not found.');
        }

        return wallet.skdBalance.toString();
    }

    static async ensureWalletExists(userId) {
        return this.createWallet(userId);
    }
}

module.exports = WalletService;
