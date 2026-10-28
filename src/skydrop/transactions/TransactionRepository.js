'use strict';

const mongoose = require('mongoose');

const {
    requireDatabaseConnection
} = require('../database/database');

const { Schema } = mongoose;

const TRANSACTION_COLLECTION = 'skydrop_transactions';

const transactionSchema = new Schema(
    {
        reference: {
            type: String,
            required: true,
            trim: true,
            immutable: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropUser',
            required: true,
            index: true
        },

        walletId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropWallet',
            required: true
        },

        type: {
            type: String,
            enum: [
                'deposit',
                'withdrawal',
                'transfer',
                'mining_reward',
                'conversion',
                'exchange',
                'fee',
                'adjustment'
            ],
            required: true
        },

        direction: {
            type: String,
            enum: ['credit', 'debit', 'internal'],
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

        status: {
            type: String,
            enum: [
                'pending',
                'processing',
                'successful',
                'failed',
                'cancelled',
                'reversed'
            ],
            default: 'pending',
            required: true
        },

        idempotencyKey: {
            type: String,
            default: null,
            trim: true
        },

        provider: {
            type: String,
            default: null,
            trim: true
        },

        providerReference: {
            type: String,
            default: null,
            trim: true
        },

        relatedTransactionId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropTransaction',
            default: null
        },

        description: {
            type: String,
            default: '',
            maxlength: 500
        },

        failureCode: {
            type: String,
            default: null
        },

        failureMessage: {
            type: String,
            default: null,
            maxlength: 500
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: () => ({})
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        collection: TRANSACTION_COLLECTION
    }
);

transactionSchema.index(
    { reference: 1 },
    { unique: true, name: 'unique_transaction_reference' }
);

transactionSchema.index(
    { userId: 1, idempotencyKey: 1 },
    {
        unique: true,
        name: 'unique_user_idempotency_key',
        partialFilterExpression: {
            idempotencyKey: { $type: 'string' }
        }
    }
);

transactionSchema.index(
    { provider: 1, providerReference: 1 },
    {
        unique: true,
        name: 'unique_provider_reference',
        partialFilterExpression: {
            providerReference: { $type: 'string' }
        }
    }
);

transactionSchema.index(
    { userId: 1, createdAt: -1 },
    { name: 'user_transaction_history' }
);

transactionSchema.index(
    { status: 1, createdAt: 1 },
    { name: 'transaction_reconciliation_queue' }
);

const Transaction =
    mongoose.models.SkyDropTransaction ||
    mongoose.model(
        'SkyDropTransaction',
        transactionSchema,
        TRANSACTION_COLLECTION
    );

class TransactionRepository {
    constructor() {
        this.model = Transaction;
    }

    async create(transactionData, options = {}) {
        requireDatabaseConnection();

        const {
            reference,
            userId,
            walletId,
            type,
            direction,
            amount,
            currency,
            idempotencyKey,
            ...additionalFields
        } = transactionData || {};

        if (
            !reference ||
            !mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(walletId) ||
            !type ||
            !direction ||
            amount === undefined ||
            amount === null ||
            !currency
        ) {
            throw new Error(
                'Reference, valid user and wallet IDs, type, direction, amount, and currency are required.'
            );
        }

        const decimalAmount = mongoose.Types.Decimal128.fromString(
            String(amount)
        );

        if (
            !Number.isFinite(Number(decimalAmount.toString())) ||
            Number(decimalAmount.toString()) <= 0
        ) {
            throw new Error('Transaction amount must be greater than zero.');
        }

        const transaction = new this.model({
            reference,
            userId,
            walletId,
            type,
            direction,
            amount: decimalAmount,
            currency: String(currency).trim().toUpperCase(),
            idempotencyKey: idempotencyKey || null,
            ...additionalFields
        });

        return transaction.save({
            session: options.session
        });
    }

    async findById(transactionId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(transactionId)) {
            return null;
        }

        let query = this.model.findById(transactionId);

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByReference(reference, options = {}) {
        requireDatabaseConnection();

        if (!reference) {
            return null;
        }

        let query = this.model.findOne({ reference });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByIdempotencyKey(userId, idempotencyKey, options = {}) {
        requireDatabaseConnection();

        if (
            !mongoose.isValidObjectId(userId) ||
            !idempotencyKey
        ) {
            return null;
        }

        let query = this.model.findOne({
            userId,
            idempotencyKey
        });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByProviderReference(
        provider,
        providerReference,
        options = {}
    ) {
        requireDatabaseConnection();

        if (!provider || !providerReference) {
            return null;
        }

        let query = this.model.findOne({
            provider,
            providerReference
        });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async updateStatus(reference, status, options = {}) {
        requireDatabaseConnection();

        const allowedStatuses = [
            'pending',
            'processing',
            'successful',
            'failed',
            'cancelled',
            'reversed'
        ];

        if (!allowedStatuses.includes(status)) {
            throw new Error('Invalid transaction status.');
        }

        const update = { status };

        if (status === 'successful') {
            update.completedAt = new Date();
        }

        return this.model.findOneAndUpdate(
            {
                reference,
                status: { $in: ['pending', 'processing'] }
            },
            { $set: update },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();
    }

    async listByUser(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        const limit = Math.min(
            Math.max(Number(options.limit) || 20, 1),
            100
        );

        const query = {
            userId
        };

        if (options.status) {
            query.status = options.status;
        }

        let databaseQuery = this.model.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        if (options.session) {
            databaseQuery = databaseQuery.session(options.session);
        }

        return databaseQuery.exec();
    }
}

module.exports = {
    TransactionRepository,
    Transaction,
    TRANSACTION_COLLECTION
};
