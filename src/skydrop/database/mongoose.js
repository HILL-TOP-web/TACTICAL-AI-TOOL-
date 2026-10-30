'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

let connectionPromise = null;
let shutdownRegistered = false;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    passwordHash: {
        type: String,
        required: true,
        select: false
    },

    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },

    firstName: {
        type: String,
        trim: true
    },

    lastName: {
        type: String,
        trim: true
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    miningEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'SkyDropUser',
        required: true,
        unique: true,
        index: true
    },

    skdBalance: {
        type: Schema.Types.Decimal128,
        default: '0'
    },

    usdBalance: {
        type: Schema.Types.Decimal128,
        default: '0'
    },

    ngnBalance: {
        type: Schema.Types.Decimal128,
        default: '0'
    },

    currency: {
        type: String,
        default: 'SKD'
    }
}, {
    timestamps: true,
    versionKey: false
});

const transactionSchema = new Schema({
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
        required: true,
        enum: [
            'mining_reward',
            'deposit',
            'withdrawal',
            'transfer',
            'conversion',
            'adjustment'
        ]
    },

    asset: {
        type: String,
        required: true,
        default: 'SKD'
    },

    amount: {
        type: Schema.Types.Decimal128,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'completed'
    },

    reference: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },

    description: {
        type: String,
        default: ''
    },

    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },

    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

const miningSessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'SkyDropUser',
        required: true,
        unique: true,
        index: true
    },

    isActive: {
        type: Boolean,
        default: false,
        index: true
    },

    startedAt: {
        type: Date,
        default: null
    },

    lastRewardAt: {
        type: Date,
        default: null
    },

    lastProcessedSecond: {
        type: Number,
        default: 0
    },

    totalEarned: {
        type: Schema.Types.Decimal128,
        default: '0'
    },

    totalSeconds: {
        type: Number,
        default: 0
    },

    lastStoppedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

const SkyDropUser =
    mongoose.models.SkyDropUser ||
    mongoose.model('SkyDropUser', userSchema);

const SkyDropWallet =
    mongoose.models.SkyDropWallet ||
    mongoose.model('SkyDropWallet', walletSchema);

const SkyDropTransaction =
    mongoose.models.SkyDropTransaction ||
    mongoose.model('SkyDropTransaction', transactionSchema);

const SkyDropMiningSession =
    mongoose.models.SkyDropMiningSession ||
    mongoose.model('SkyDropMiningSession', miningSessionSchema);

async function connectMongoDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is required.');
    }

    connectionPromise = mongoose.connect(mongoUri, {
        autoIndex: process.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 20,
        minPoolSize: 2
    });

    try {
        await connectionPromise;

        console.info('SkyDrop MongoDB connection established.');

        return mongoose.connection;
    } catch (error) {
        connectionPromise = null;
        throw error;
    }
}

async function disconnectMongoDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    connectionPromise = null;
}

function registerGracefulShutdown(server) {
    if (shutdownRegistered) {
        return;
    }

    shutdownRegistered = true;

    const shutdown = async (signal) => {
        console.info(`Received ${signal}. Closing SkyDrop services.`);

        try {
            if (server && server.listening) {
                await new Promise((resolve) => {
                    server.close(resolve);
                });
            }

            await disconnectMongoDB();

            process.exit(0);
        } catch (error) {
            console.error('Graceful shutdown failed:', error.message);
            process.exit(1);
        }
    };

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
    mongoose,
    connectMongoDB,
    disconnectMongoDB,
    registerGracefulShutdown,

    SkyDropUser,
    SkyDropWallet,
    SkyDropTransaction,
    SkyDropMiningSession
};
