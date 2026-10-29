'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepositSchema = new Schema(
    {
        depositId: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            index: true
        },

        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null,
            index: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        walletId: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true
        },

        amount: {
            type: Schema.Types.Decimal128,
            required: true,
            validate: {
                validator(value) {
                    return (
                        value &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) > 0
                    );
                },
                message: 'Deposit amount must be positive.'
            }
        },

        currency: {
            type: String,
            required: true,
            uppercase: true,
            enum: [
                'NGN',
                'USD',
                'USDT',
                'SKD'
            ]
        },

        provider: {
            type: String,
            required: true,
            trim: true
        },

        providerReference: {
            type: String,
            trim: true,
            default: null
        },

        paymentReference: {
            type: String,
            trim: true,
            default: null
        },

        status: {
            type: String,
            required: true,
            enum: [
                'pending',
                'processing',
                'confirmed',
                'credited',
                'failed',
                'reversed'
            ],
            default: 'pending',
            index: true
        },

        providerVerified: {
            type: Boolean,
            default: false
        },

        confirmedAt: {
            type: Date,
            default: null
        },

        creditedAt: {
            type: Date,
            default: null
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: () => ({})
        }
    },
    {
        timestamps: true,
        strict: 'throw'
    }
);

DepositSchema.index({
    userId: 1,
    createdAt: -1
});

DepositSchema.index({
    walletId: 1,
    createdAt: -1
});

DepositSchema.index({
    status: 1,
    createdAt: -1
});

DepositSchema.index(
    {
        provider: 1,
        providerReference: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            providerReference: {
                $type: 'string'
            }
        },
        name: 'unique_provider_deposit_reference'
    }
);

module.exports =
    mongoose.models.Deposit ||
    mongoose.model('Deposit', DepositSchema);
