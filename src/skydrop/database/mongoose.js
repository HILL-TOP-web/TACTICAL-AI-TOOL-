'use strict';

const mongoose = require('mongoose');

let connectionPromise = null;
let shutdownRegistered = false;

const DEFAULT_OPTIONS = {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 0,
    retryWrites: true
};

function getMongoUri() {
    const uri = process.env.MONGODB_URI;

    if (typeof uri !== 'string' || uri.trim() === '') {
        throw new Error('MONGODB_URI is required.');
    }

    return uri.trim();
}

function registerConnectionListeners() {
    mongoose.connection.on('connected', () => {
        console.info('[SkyDrop Database] MongoDB connected.');
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('[SkyDrop Database] MongoDB disconnected.');
    });

    mongoose.connection.on('error', (error) => {
        console.error(
            '[SkyDrop Database] Connection error:',
            error.message
        );
    });

    mongoose.connection.on('reconnected', () => {
        console.info('[SkyDrop Database] MongoDB reconnected.');
    });
}

function connectMongoDB() {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    let uri;

    try {
        uri = getMongoUri();
    } catch (error) {
        return Promise.reject(error);
    }

    connectionPromise = mongoose.connect(uri, DEFAULT_OPTIONS)
        .then(() => mongoose.connection)
        .catch((error) => {
            connectionPromise = null;

            throw new Error(
                `MongoDB startup failed: ${error.message}`
            );
        });

    return connectionPromise;
}

async function disconnectMongoDB() {
    connectionPromise = null;

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

function registerGracefulShutdown() {
    if (shutdownRegistered) {
        return;
    }

    shutdownRegistered = true;

    const shutdown = async (signal) => {
        console.info(
            `[SkyDrop Database] Received ${signal}. Closing MongoDB connection.`
        );

        try {
            await disconnectMongoDB();
        } catch (error) {
            console.error(
                '[SkyDrop Database] Shutdown failed:',
                error.message
            );

            process.exitCode = 1;
        }
    };

    process.once('SIGINT', () => {
        void shutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
}

registerConnectionListeners();

module.exports = {
    mongoose,
    connectMongoDB,
    disconnectMongoDB,
    registerGracefulShutdown
};
