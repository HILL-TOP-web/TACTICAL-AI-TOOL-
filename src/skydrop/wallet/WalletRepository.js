'use strict';

const mongoose = require('mongoose');

const {
    requireDatabaseConnection
} = require('../database/database');

const { Schema } = mongoose;

const WALLET_COLLECTION = 'skydrop_wallets';

const decimalZero = () => mongoose.Types.Decimal128.fromString('0');

function toDecimal128(value, fieldName = 'amount') {
    let text;

    if (mongoose.Types.Decimal128.isDecimal128(value)) {
        text = value.toString();
    } else if (typeof value === 'string') {
        text = value.trim();
    } else if (typeof value === 'number' && Number.isFinite(value)) {
        text = String(value);
    } else {
        throw new Error(`${fieldName} must be a valid decimal amount.`);
    }

    if (!/^-?\d+(?:\.\d+)?$/.test(text)) {
        throw new Error(`${fieldName} must be a valid decimal amount.`);
    }

    const decimal = mongoose.Types.Decimal128.fromString(text);

    if (decimal.toString() !== text && !/^-?\d+(?:\.\d+)?0+$/.test(text)) {
        throw new Error(`${fieldName} has an unsupported decimal representation.`);
    }

    return decimal;
}

const walletSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropUser',
            required: true
        },

        currency: {
            type: String,
            required: true,
            enum: ['SKD', 'USD', 'NGN', 'USDT'],
            uppercase: true,
            trim: true
        },

        balance: {
            type: Schema.Types.Decimal128,
            default: decimalZero,
            required: true
        },

        availableBalance: {
            type: Schema.Types.Decimal128,
            default: decimalZero,
            required: true
        },

        lockedBalance: {
            type: Schema.Types.Decimal128,
            default: decimalZero,
            required: true
        },

        status: {
            type: String,
            enum: ['active', 'frozen', 'closed'],
            default: 'active',
            required: true
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        collection: WALLET_COLLECTION
    }
);

walletSchema.index(
    { userId: 1, currency: 1 },
    { unique: true, name: 'unique_user_currency_wallet' }
);

walletSchema.index(
    { userId: 1, status: 1 },
    { name: 'wallet_user_status' }
);

const Wallet =
    mongoose.models.SkyDropWallet ||
    mongoose.model(
        'SkyDropWallet',
        walletSchema,
        WALLET_COLLECTION
    );

class WalletRepository {
    constructor() {
        this.model = Wallet;
    }

    async createWallet(userId, currency, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        const normalizedCurrency =
            String(currency || '').trim().toUpperCase();

        if (!['SKD', 'USD', 'NGN', 'USDT'].includes(normalizedCurrency)) {
            throw new Error('Unsupported wallet currency.');
        }

        return this.model.create(
            [
                {
                    userId,
                    currency: normalizedCurrency,
                    balance: decimalZero(),
                    availableBalance: decimalZero(),
                    lockedBalance: decimalZero(),
                    status: 'active'
                }
            ],
            {
                session: options.session
            }
        ).then((wallets) => wallets[0]);
    }

    async findById(walletId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(walletId)) {
            return null;
        }

        let query = this.model.findById(walletId);

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByUserAndCurrency(userId, currency, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            return null;
        }

        let query = this.model.findOne({
            userId,
            currency: String(currency || '').trim().toUpperCase()
        });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async listByUser(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        let query = this.model.find({ userId })
            .sort({ createdAt: 1 });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async creditAvailable(walletId, amount, options = {}) {
        requireDatabaseConnection();

        const credit = toDecimal128(amount);

        if (credit.toString().startsWith('-') || credit.toString() === '0') {
            throw new Error('Credit amount must be greater than zero.');
        }

        if (!mongoose.isValidObjectId(walletId)) {
            throw new Error('Invalid wallet ID.');
        }

        const wallet = await this.model.findOneAndUpdate(
            {
                _id: walletId,
                status: 'active'
            },
            {
                $inc: {
                    balance: credit,
                    availableBalance: credit
                }
            },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();

        if (!wallet) {
            throw new Error('Active wallet not found.');
        }

        return wallet;
    }

    async debitAvailable(walletId, amount, options = {}) {
        requireDatabaseConnection();

        const debit = toDecimal128(amount);

        if (debit.toString().startsWith('-') || debit.toString() === '0') {
            throw new Error('Debit amount must be greater than zero.');
        }

        if (!mongoose.isValidObjectId(walletId)) {
            throw new Error('Invalid wallet ID.');
        }

        const wallet = await this.model.findOneAndUpdate(
            {
                _id: walletId,
                status: 'active',
                availableBalance: { $gte: debit },
                balance: { $gte: debit }
            },
            {
                $inc: {
                    balance: toDecimal128(`-${debit.toString()}`),
                    availableBalance: toDecimal128(`-${debit.toString()}`)
                }
            },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();

        if (!wallet) {
            throw new Error(
                'Wallet not found, inactive, or insufficient available balance.'
            );
        }

        return wallet;
    }

    async freezeWallet(walletId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(walletId)) {
            throw new Error('Invalid wallet ID.');
        }

        return this.model.findByIdAndUpdate(
            walletId,
            { $set: { status: 'frozen' } },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();
    }
}

module.exports = {
    WalletRepository,
    Wallet,
    WALLET_COLLECTION,
    toDecimal128
};
