'use strict';

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },

    reference: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String,
        required: true,
        enum: [
            'mining',
            'reward',
            'conversion',
            'exchange',
            'transfer',
            'withdrawal',
            'deposit'
        ]
    },

    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    currency: {
        type: String,
        required: true,
        uppercase: true
    },

    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'processing',
            'successful',
            'failed',
            'reversed'
        ],
        default: 'pending'
    },

    description: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false
});

transactionSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports = mongoose.models.SkyDropTransaction ||
    mongoose.model('SkyDropTransaction', transactionSchema);
