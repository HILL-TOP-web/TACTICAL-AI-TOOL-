'use strict';

const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
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

        recipientBankCode: {
            type: String,
            required: true,
            trim: true,
            select: false
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        currency: {
            type: String,
            default: 'NGN',
            uppercase: true
        },

        narration: {
            type: String,
            default: ''
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

        providerReference: {
            type: String,
            default: null,
            select: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

transferSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports =
    mongoose.models.Transfer ||
    mongoose.model('Transfer', transferSchema);
