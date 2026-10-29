'use strict';

const mongoose = require('mongoose');

let connectionPromise = null;

async function connectMongoDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri || !uri.trim()) {
        throw new Error(
            'MONGODB_URI must be configured before connecting to MongoDB.'
        );
    }

    connectionPromise = mongoose.connect(uri, {
        autoIndex: process.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 10000
    });

    try {
        await connectionPromise;

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.error('MongoDB connection disconnected.');
        });

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

module.exports = {
    mongoose,
    connectMongoDB,
    disconnectMongoDB
};
