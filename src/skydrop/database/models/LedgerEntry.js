'use strict';

const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
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

        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Transaction'
        },

        reference: {
            type: String,
            required: true,
            trim: true
        },

        entryType: {
            type: String,
            required: true,
            enum: ['debit', 'credit']
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            required: true,
            uppercase: true
        },

        balanceAfter: {
            type: Number,
            required: true,
            min: 0
        },

        description: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

ledgerEntrySchema.index(
    {
        reference: 1,
        entryType: 1
    },
    {
        unique: true
    }
);

ledgerEntrySchema.index({
    walletId: 1,
    createdAt: -1
});

module.exports =
    mongoose.models.LedgerEntry ||
    mongoose.model('LedgerEntry', ledgerEntrySchema);
