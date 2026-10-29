'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const WithdrawalSchema = new Schema(
    {
        withdrawalId: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            index: true
        },

        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            required: true,
            unique: true
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
                message: 'Withdrawal amount must be positive.'
            }
        },

        fee: {
            type: Schema.Types.Decimal128,
            required: true,
            default: '0'
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

        method: {
            type: String,
            required: true,
            enum: [
                'monnify',
                'internal_wallet',
                'other'
            ]
        },

        destination: {
            accountNumber: {
                type: String,
                trim: true,
                default: null
            },

            accountName: {
                type: String,
                trim: true,
                default: null
            },

            bankCode: {
                type: String,
                trim: true,
                default: null
            },

            bankName: {
                type: String,
                trim: true,
                default: null
            }
        },

        providerReference: {
            type: String,
            trim: true,
            default: null
        },

        providerStatus: {
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
                'completed',
                'failed',
                'cancelled',
                'reversed'
            ],
            default: 'pending',
            index: true
        },

        failureReason: {
            type: String,
            maxlength: 500,
            default: null
        },

        requestedAt: {
            type: Date,
            default: Date.now,
            immutable: true
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw'
    }
);

WithdrawalSchema.index({
    userId: 1,
    createdAt: -1
});

WithdrawalSchema.index({
    status: 1,
    createdAt: -1
});

WithdrawalSchema.index(
    {
        method: 1,
        providerReference: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            providerReference: {
                $type: 'string'
            }
        }
    }
);

module.exports =
    mongoose.models.Withdrawal ||
    mongoose.model('Withdrawal', WithdrawalSchema);
