'use strict';

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },

    skdBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: '0'
    },

    usdBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: '0'
    },

    usdtBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: '0'
    },

    ngnBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: '0'
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

walletSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.models.SkyDropWallet ||
    mongoose.model('SkyDropWallet', walletSchema);
