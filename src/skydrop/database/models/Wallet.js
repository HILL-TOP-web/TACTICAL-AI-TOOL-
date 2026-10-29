'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const WalletSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        currency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            enum: [
                'NGN',
                'USD',
                'USDT',
                'SKD'
            ]
        },

        balance: {
            type: Schema.Types.Decimal128,
            required: true,
            default: '0',
            validate: {
                validator(value) {
                    return (
                        value &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) >= 0
                    );
                },
                message: 'Wallet balance cannot be negative.'
            }
        },

        status: {
            type: String,
            enum: [
                'active',
                'frozen',
                'closed'
            ],
            default: 'active',
            index: true
        },

        allowDeposits: {
            type: Boolean,
            default: true
        },

        allowWithdrawals: {
            type: Boolean,
            default: true
        },

        allowTransfers: {
            type: Boolean,
            default: true
        },

        lastTransactionAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw'
    }
);

WalletSchema.index(
    {
        userId: 1,
        currency: 1
    },
    {
        unique: true,
        name: 'unique_user_wallet_currency'
    }
);

WalletSchema.index({
    status: 1,
    updatedAt: -1
});

module.exports =
    mongoose.models.Wallet ||
    mongoose.model('Wallet', WalletSchema);
