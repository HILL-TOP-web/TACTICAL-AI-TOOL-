'use strict';

const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
    {
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction',
            required: true,
            immutable: true,
            index: true
        },

        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            immutable: true,
            index: true
        },

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
            enum: ['SKD', 'USD', 'NGN'],
            immutable: true
        },

        entryType: {
            type: String,
            required: true,
            enum: ['debit', 'credit'],
            immutable: true
        },

        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            immutable: true
        },

        description: {
            type: String,
            maxlength: 500,
            default: '',
            immutable: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

ledgerEntrySchema.index(
    {
        transactionId: 1,
        walletId: 1,
        entryType: 1
    },
    {
        unique: true,
        name: 'unique_transaction_wallet_entry_type'
    }
);

ledgerEntrySchema.pre('validate', function validateLedgerEntry() {
    if (!this.amount) {
        return;
    }

    const amount = Number(this.amount.toString());

    if (!Number.isFinite(amount) || amount <= 0) {
        this.invalidate(
            'amount',
            'Ledger entry amount must be greater than zero.'
        );
    }
});

ledgerEntrySchema.pre('findOneAndUpdate', function preventLedgerUpdates() {
    throw new Error('Ledger entries are immutable and cannot be updated.');
});

ledgerEntrySchema.pre('updateOne', function preventLedgerUpdates() {
    throw new Error('Ledger entries are immutable and cannot be updated.');
});

ledgerEntrySchema.pre('updateMany', function preventLedgerUpdates() {
    throw new Error('Ledger entries are immutable and cannot be updated.');
});

ledgerEntrySchema.pre('deleteOne', function preventLedgerDeletes() {
    throw new Error('Ledger entries cannot be deleted.');
});

ledgerEntrySchema.pre('deleteMany', function preventLedgerDeletes() {
    throw new Error('Ledger entries cannot be deleted.');
});

module.exports =
    mongoose.models.LedgerEntry ||
    mongoose.model('LedgerEntry', ledgerEntrySchema);
