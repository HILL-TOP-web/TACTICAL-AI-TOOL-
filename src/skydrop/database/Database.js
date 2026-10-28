'use strict';

const mongoose = require('mongoose');
const { getDatabaseConfig } = require('./databaseConfig');

let connectionPromise = null;

function isConnected() {
    return mongoose.connection.readyState === 1;
}

function isConnecting() {
    return mongoose.connection.readyState === 2;
}

async function connectDatabase() {
    if (isConnected()) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const config = getDatabaseConfig();

    connectionPromise = (async () => {
        try {
            await mongoose.connect(config.uri, {
                ...config.options,
                dbName: config.databaseName
            });

            if (!isConnected()) {
                throw new Error(
                    'MongoDB connection did not reach the connected state.'
                );
            }

            return mongoose.connection;
        } catch (error) {
            await mongoose.disconnect().catch(() => {});

            throw new Error(
                `MongoDB connection failed: ${error.message}`
            );
        }
    })();

    try {
        return await connectionPromise;
    } finally {
        connectionPromise = null;
    }
}

async function disconnectDatabase() {
    if (connectionPromise) {
        try {
            await connectionPromise;
        } catch {
            // Continue with shutdown after a failed connection attempt.
        }
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

function getDatabaseStatus() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    return {
        connected: isConnected(),
        connecting: isConnecting(),
        state:
            states[mongoose.connection.readyState] || 'unknown',
        database:
            mongoose.connection.readyState === 1
                ? mongoose.connection.name
                : null
    };
}

function getMongoose() {
    return mongoose;
}

function getConnection() {
    return mongoose.connection;
}

function requireDatabaseConnection() {
    if (!isConnected()) {
        throw new Error(
            'MongoDB is not connected. Connect the database before accessing SkyDrop repositories.'
        );
    }

    return mongoose.connection;
}

async function withTransaction(callback, options = {}) {
    if (typeof callback !== 'function') {
        throw new TypeError(
            'withTransaction requires a callback function.'
        );
    }

    requireDatabaseConnection();

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(
            async () => {
                result = await callback(session);
            },
            {
                readPreference: 'primary',
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                ...options
            }
        );

        return result;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    connectDatabase,
    disconnectDatabase,
    getDatabaseStatus,
    getMongoose,
    getConnection,
    requireDatabaseConnection,
    withTransaction
};
