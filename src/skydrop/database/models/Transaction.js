'use strict';

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        reference: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            index: true
        },

        idempotencyKey: {
            type: String,
            default: null
        },

        type: {
            type: String,
            enum: [
                'internal_transfer',
                'deposit',
                'withdrawal',
                'conversion',
                'reward',
                'adjustment'
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                'pending',
                'processing',
                'completed',
                'failed',
                'reversed'
            ],
            default: 'pending',
            required: true,
            index: true
        },

        senderUserId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true
        },

        recipientUserId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true
        },

        senderWalletId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        recipientWalletId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        currency: {
            type: String,
            required: true,
            uppercase: true,
            enum: ['SKD', 'USD', 'NGN']
        },

        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        },

        fee: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: () => mongoose.Types.Decimal128.fromString('0')
        },

        description: {
            type: String,
            maxlength: 500,
            default: ''
        },

        failureCode: {
            type: String,
            default: null
        },

        failureReason: {
            type: String,
            default: null,
            maxlength: 500
        },

        completedAt: {
            type: Date,
            default: null
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({})
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

transactionSchema.index(
    {
        senderUserId: 1,
        createdAt: -1
    },
    {
        name: 'sender_transaction_history'
    }
);

transactionSchema.index(
    {
        recipientUserId: 1,
        createdAt: -1
    },
    {
        name: 'recipient_transaction_history'
    }
);

transactionSchema.index(
    {
        idempotencyKey: 1,
        senderUserId: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: {
                $type: 'string'
            }
        },
        name: 'unique_sender_idempotency_key'
    }
);

transactionSchema.pre('validate', function validateAmounts() {
    for (const field of ['amount', 'fee']) {
        if (!this[field]) {
            continue;
        }

        const value = Number(this[field].toString());

        if (!Number.isFinite(value) || value < 0) {
            this.invalidate(
                field,
                `${field} must be a non-negative finite number.`
            );
        }
    }

    if (
        this.type === 'internal_transfer' &&
        (!this.senderUserId ||
            !this.recipientUserId ||
            !this.senderWalletId ||
            !this.recipientWalletId)
    ) {
        this.invalidate(
            'senderUserId',
            'Internal transfers require sender and recipient identities and wallets.'
        );
    }
});

module.exports =
    mongoose.models.Transaction ||
    mongoose.model('Transaction', transactionSchema);
