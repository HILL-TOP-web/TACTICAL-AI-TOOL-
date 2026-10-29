'use strict';

const mongoose = require('mongoose');
const Wallet = require('../database/models/Wallet');

class WalletRepository {
    async findById(walletId, options = {}) {
        if (!mongoose.isValidObjectId(walletId)) {
            return null;
        }

        return Wallet.findById(walletId)
            .session(options.session || null)
            .exec();
    }

    async findByUserAndCurrency(userId, currency, options = {}) {
        if (!mongoose.isValidObjectId(userId)) {
            return null;
        }

        return Wallet.findOne({
            userId,
            currency: String(currency).toUpperCase()
        })
            .session(options.session || null)
            .exec();
    }

    async findOrCreateForUser(userId, currency, options = {}) {
        const normalizedCurrency = String(currency).toUpperCase();

        const existing = await this.findByUserAndCurrency(
            userId,
            normalizedCurrency,
            options
        );

        if (existing) {
            return existing;
        }

        const wallet = new Wallet({
            userId,
            currency: normalizedCurrency,
            balance: '0'
        });

        await wallet.save({
            session: options.session
        });

        return wallet;
    }

    async getBalance(walletId, options = {}) {
        const wallet = await this.findById(walletId, options);

        if (!wallet) {
            return null;
        }

        return {
            walletId: wallet._id,
            userId: wallet.userId,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            status: wallet.status
        };
    }

    async debit(walletId, amount, options = {}) {
        const wallet = await Wallet.findOneAndUpdate(
            {
                _id: walletId,
                status: 'active',
                balance: {
                    $gte: mongoose.Types.Decimal128.fromString(amount)
                }
            },
            {
                $inc: {
                    balance: mongoose.Types.Decimal128.fromString(
                        `-${amount}`
                    )
                }
            },
            {
                new: true,
                session: options.session,
                runValidators: true
            }
        ).exec();

        if (!wallet) {
            const error = new Error(
                'Wallet is unavailable or has insufficient funds.'
            );

            error.code = 'WALLET_DEBIT_FAILED';

            throw error;
        }

        return wallet;
    }

    async credit(walletId, amount, options = {}) {
        const wallet = await Wallet.findOneAndUpdate(
            {
                _id: walletId,
                status: 'active'
            },
            {
                $inc: {
                    balance: mongoose.Types.Decimal128.fromString(amount)
                }
            },
            {
                new: true,
                session: options.session,
                runValidators: true
            }
        ).exec();

        if (!wallet) {
            const error = new Error(
                'Recipient wallet is unavailable.'
            );

            error.code = 'WALLET_CREDIT_FAILED';

            throw error;
        }

        return wallet;
    }

    async listByUser(userId) {
        if (!mongoose.isValidObjectId(userId)) {
            return [];
        }

        return Wallet.find({
            userId
        })
            .sort({ currency: 1 })
            .exec();
    }
}

module.exports = new WalletRepository();
module.exports.WalletRepository = WalletRepository;
