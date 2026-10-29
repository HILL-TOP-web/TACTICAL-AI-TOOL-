'use strict';

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
            ref: 'User'
        },

        currency: {
            type: String,
            default: 'NGN',
            uppercase: true,
            trim: true
        },

        availableBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        pendingBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        lockedBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ['active', 'suspended', 'closed'],
            default: 'active',
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

walletSchema.index({
    userId: 1,
    currency: 1
});

module.exports =
    mongoose.models.Wallet ||
    mongoose.model('Wallet', walletSchema);
