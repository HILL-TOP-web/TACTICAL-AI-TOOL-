'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const TransactionSchema = new Schema(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            trim: true,
            index: true
        },

        idempotencyKey: {
            type: String,
            trim: true,
            default: null
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

        type: {
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
            ],
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
                message: 'Transaction amount must be positive.'
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
            default: () => ({}
            )
        },

        completedAt: {
            type: Date,
            default: null
        },

        failedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw'
    }
);

TransactionSchema.index({
    userId: 1,
    createdAt: -1
});

TransactionSchema.index({
    walletId: 1,
    createdAt: -1
});

TransactionSchema.index(
    {
        userId: 1,
        idempotencyKey: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: {
                $type: 'string'
            }
        },
        name: 'unique_user_transaction_idempotency'
    }
);

TransactionSchema.index(
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
        },
        name: 'unique_provider_transaction_reference'
    }
);

TransactionSchema.index({
    status: 1,
    createdAt: -1
});

module.exports =
    mongoose.models.Transaction ||
    mongoose.model('Transaction', TransactionSchema);
