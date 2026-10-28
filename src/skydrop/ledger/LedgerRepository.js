'use strict';

const mongoose = require('mongoose');

const {
    requireDatabaseConnection
} = require('../database/database');

const { Schema } = mongoose;

const LEDGER_COLLECTION = 'skydrop_ledger_entries';

const ledgerEntrySchema = new Schema(
    {
        entryReference: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            immutable: true
        },

        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropTransaction',
            required: true
        },

        transactionReference: {
            type: String,
            required: true,
            trim: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropUser',
            required: true
        },

        walletId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropWallet',
            required: true
        },

        entryType: {
            type: String,
            enum: [
                'credit',
                'debit',
                'reversal',
                'adjustment'
            ],
            required: true
        },

        amount: {
            type: Schema.Types.Decimal128,
            required: true
        },

        currency: {
            type: String,
            enum: ['SKD', 'USD', 'NGN', 'USDT'],
            required: true
        },

        balanceBefore: {
            type: Schema.Types.Decimal128,
            required: true
        },

        balanceAfter: {
            type: Schema.Types.Decimal128,
            required: true
        },

        description: {
            type: String,
            default: '',
            maxlength: 500
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: () => ({})
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        collection: LEDGER_COLLECTION
    }
);

ledgerEntrySchema.index(
    { transactionId: 1, walletId: 1, entryType: 1 },
    {
        unique: true,
        name: 'unique_transaction_wallet_entry_type'
    }
);

ledgerEntrySchema.index(
    { userId: 1, createdAt: -1 },
    { name: 'user_ledger_history' }
);

ledgerEntrySchema.index(
    { walletId: 1, createdAt: -1 },
    { name: 'wallet_ledger_history' }
);

const LedgerEntry =
    mongoose.models.SkyDropLedgerEntry ||
    mongoose.model(
        'SkyDropLedgerEntry',
        ledgerEntrySchema,
        LEDGER_COLLECTION
    );

class LedgerRepository {
    constructor() {
        this.model = LedgerEntry;
    }

    async createEntry(entryData, options = {}) {
        requireDatabaseConnection();

        const {
            entryReference,
            transactionId,
            transactionReference,
            userId,
            walletId,
            entryType,
            amount,
            currency,
            balanceBefore,
            balanceAfter,
            description,
            metadata
        } = entryData || {};

        if (
            !entryReference ||
            !mongoose.isValidObjectId(transactionId) ||
            !transactionReference ||
            !mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(walletId) ||
            !entryType ||
            amount === undefined ||
            balanceBefore === undefined ||
            balanceAfter === undefined ||
            !currency
        ) {
            throw new Error(
                'Missing or invalid required ledger entry fields.'
            );
        }

        const amountDecimal =
            mongoose.Types.Decimal128.fromString(String(amount));

        const beforeDecimal =
            mongoose.Types.Decimal128.fromString(String(balanceBefore));

        const afterDecimal =
            mongoose.Types.Decimal128.fromString(String(balanceAfter));

        if (
            !Number.isFinite(Number(amountDecimal.toString())) ||
            Number(amountDecimal.toString()) <= 0
        ) {
            throw new Error('Ledger amount must be greater than zero.');
        }

        if (
            !Number.isFinite(Number(beforeDecimal.toString())) ||
            !Number.isFinite(Number(afterDecimal.toString()))
        ) {
            throw new Error('Ledger balances must be valid decimal values.');
        }

        const entry = new this.model({
            entryReference,
            transactionId,
            transactionReference,
            userId,
            walletId,
            entryType,
            amount: amountDecimal,
            currency: String(currency).trim().toUpperCase(),
            balanceBefore: beforeDecimal,
            balanceAfter: afterDecimal,
            description,
            metadata
        });

        return entry.save({
            session: options.session
        });
    }

    async findByEntryReference(entryReference, options = {}) {
        requireDatabaseConnection();

        if (!entryReference) {
            return null;
        }

        let query = this.model.findOne({ entryReference });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByTransactionId(transactionId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(transactionId)) {
            throw new Error('Invalid transaction ID.');
        }

        let query = this.model.find({
            transactionId
        }).sort({ createdAt: 1 });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByWallet(walletId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(walletId)) {
            throw new Error('Invalid wallet ID.');
        }

        const limit = Math.min(
            Math.max(Number(options.limit) || 50, 1),
            100
        );

        let query = this.model.find({
            walletId
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByUser(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        const limit = Math.min(
            Math.max(Number(options.limit) || 50, 1),
            100
        );

        let query = this.model.find({
            userId
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }
}

module.exports = {
    LedgerRepository,
    LedgerEntry,
    LEDGER_COLLECTION
};
