'use strict';

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            immutable: true,
            index: true
        },

        currency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            enum: ['SKD', 'USD', 'NGN']
        },

        balance: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: () => mongoose.Types.Decimal128.fromString('0')
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
        versionKey: false
    }
);

walletSchema.index(
    {
        userId: 1,
        currency: 1
    },
    {
        unique: true,
        name: 'unique_user_currency_wallet'
    }
);

walletSchema.pre('validate', function validateBalance() {
    if (!this.balance) {
        return;
    }

    const balance = Number(this.balance.toString());

    if (!Number.isFinite(balance) || balance < 0) {
        this.invalidate(
            'balance',
            'Wallet balance must be a non-negative finite number.'
        );
    }
});

module.exports =
    mongoose.models.Wallet ||
    mongoose.model('Wallet', walletSchema);
