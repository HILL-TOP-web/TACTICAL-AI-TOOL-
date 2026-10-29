'use strict';

const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
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
            ref: 'Wallet'
        },

        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null
        },

        reference: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        recipientName: {
            type: String,
            required: true,
            trim: true
        },

        recipientAccountNumber: {
            type: String,
            required: true,
            trim: true,
            select: false
        },

        amount: {
            type: Number,
            required: true,
            min: 100
        },

        currency: {
            type: String,
            default: 'NGN',
            uppercase: true
        },

        provider: {
            type: String,
            default: 'monnify',
            lowercase: true
        },

        providerReference: {
            type: String,
            default: null,
            select: false
        },

        status: {
            type: String,
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

        failureReason: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

withdrawalSchema.index({
    userId: 1,
    createdAt: -1
});

withdrawalSchema.index({
    status: 1,
    createdAt: 1
});

module.exports =
    mongoose.models.Withdrawal ||
    mongoose.model('Withdrawal', withdrawalSchema);
