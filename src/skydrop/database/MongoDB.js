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

    if (typeof uri !== 'string' || !uri.trim()) {
        throw new Error(
            'MONGODB_URI must be configured in the environment.'
        );
    }

    connectionPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    try {
        await connectionPromise;

        return mongoose.connection;
    } catch (error) {
        connectionPromise = null;
        throw error;
    }
}

async function disconnectMongoDB() {
    await mongoose.disconnect();
    connectionPromise = null;
}

module.exports = {
    connectMongoDB,
    disconnectMongoDB
};
