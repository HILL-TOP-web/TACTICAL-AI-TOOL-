'use strict';

const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
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

    recipientAccountNumber: {
        type: String,
        required: true
    },

    recipientName: {
        type: String,
        default: ''
    },

    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },

    currency: {
        type: String,
        default: 'NGN',
        uppercase: true
    },

    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'successful',
            'failed',
            'reversed'
        ],
        default: 'pending'
    },

    providerReference: {
        type: String,
        default: null
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

transferSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports = mongoose.models.SkyDropTransfer ||
    mongoose.model('SkyDropTransfer', transferSchema);
