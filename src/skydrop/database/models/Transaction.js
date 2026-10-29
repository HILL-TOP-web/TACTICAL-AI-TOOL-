'use strict';

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
            ref: 'User'
        },

        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
            ref: 'Wallet'
        },

        reference: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        type: {
            type: String,
            required: true,
            enum: [
                'deposit',
                'withdrawal',
                'transfer',
                'conversion',
                'mining_reward',
                'fee',
                'refund',
                'adjustment'
            ],
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        status: {
            type: String,
            required: true,
            enum: [
                'pending',
                'processing',
                'successful',
                'failed',
                'cancelled',
                'reconciliation_required'
            ],
            default: 'pending',
            index: true
        },

        description: {
            type: String,
            default: ''
        },

        relatedReference: {
            type: String,
            default: null,
            index: true
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

transactionSchema.index({
    userId: 1,
    createdAt: -1
});

transactionSchema.index({
    userId: 1,
    type: 1,
    createdAt: -1
});

module.exports =
    mongoose.models.Transaction ||
    mongoose.model('Transaction', transactionSchema);
