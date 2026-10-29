'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const LedgerEntrySchema = new Schema(
    {
        entryId: {
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
            index: true
        },

        walletId: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        direction: {
            type: String,
            required: true,
            enum: [
                'debit',
                'credit'
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
                message: 'Ledger amount must be positive.'
            }
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

        balanceBefore: {
            type: Schema.Types.Decimal128,
            required: true
        },

        balanceAfter: {
            type: Schema.Types.Decimal128,
            required: true
        },

        entryType: {
            type: String,
            required: true,
            enum: [
                'deposit',
                'withdrawal',
                'transfer',
                'conversion',
                'mining_reward',
                'task_reward',
                'refund',
                'adjustment'
            ]
        },

        reference: {
            type: String,
            trim: true,
            default: null
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
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

LedgerEntrySchema.index({
    walletId: 1,
    createdAt: -1
});

LedgerEntrySchema.index({
    userId: 1,
    createdAt: -1
});

LedgerEntrySchema.index({
    transactionId: 1,
    direction: 1
});

module.exports =
    mongoose.models.LedgerEntry ||
    mongoose.model('LedgerEntry', LedgerEntrySchema);
