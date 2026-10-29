'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const TransferSchema = new Schema(
    {
        transferId: {
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

        senderUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        senderWalletId: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true
        },

        recipientUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },

        recipientWalletId: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            default: null,
            index: true
        },

        recipientAccountNumber: {
            type: String,
            trim: true,
            default: null
        },

        recipientAccountName: {
            type: String,
            trim: true,
            default: null
        },

        destinationType: {
            type: String,
            required: true,
            enum: [
                'internal_wallet',
                'external_bank'
            ]
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
                message: 'Transfer amount must be positive.'
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

        fee: {
            type: Schema.Types.Decimal128,
            default: '0',
            required: true
        },

        status: {
            type: String,
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

        provider: {
            type: String,
            trim: true,
            default: null
        },

        providerReference: {
            type: String,
            trim: true,
            default: null
        },

        failureReason: {
            type: String,
            maxlength: 500,
            default: null
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

TransferSchema.index({
    senderUserId: 1,
    createdAt: -1
});

TransferSchema.index({
    recipientUserId: 1,
    createdAt: -1
});

TransferSchema.index({
    status: 1,
    createdAt: -1
});

TransferSchema.index(
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
        }
    }
);

module.exports =
    mongoose.models.Transfer ||
    mongoose.model('Transfer', TransferSchema);
