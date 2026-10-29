'use strict';

const mongoose = require('mongoose');

const miningSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ['ACTIVE', 'STOPPED', 'COMPLETED'],
            default: 'ACTIVE',
            index: true
        },

        startedAt: {
            type: Date,
            required: true,
            default: Date.now
        },

        stoppedAt: {
            type: Date,
            default: null
        },

        lastRewardAt: {
            type: Date,
            default: null
        },

        totalReward: {
            type: mongoose.Schema.Types.Decimal128,
            default: () => mongoose.Types.Decimal128.fromString('0')
        },

        rewardCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true,
        collection: 'mining_sessions'
    }
);

miningSessionSchema.index({
    userId: 1,
    status: 1
});

module.exports =
    mongoose.models.MiningSession ||
    mongoose.model(
        'MiningSession',
        miningSessionSchema
    );
