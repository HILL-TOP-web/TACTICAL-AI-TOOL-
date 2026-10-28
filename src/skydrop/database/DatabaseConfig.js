'use strict';

const DEFAULT_DATABASE_NAME = 'skydrop';

function readInteger(name, fallback, minimum, maximum) {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue.trim() === '') {
        return fallback;
    }

    const value = Number(rawValue);

    if (
        !Number.isInteger(value) ||
        value < minimum ||
        value > maximum
    ) {
        throw new Error(
            `Invalid ${name}: expected an integer between ${minimum} and ${maximum}.`
        );
    }

    return value;
}

function getDatabaseConfig() {
    const uri = process.env.MONGODB_URI;

    if (!uri || !uri.trim()) {
        throw new Error(
            'MONGODB_URI is required. Configure it in your environment.'
        );
    }

    const databaseName =
        process.env.MONGODB_DATABASE_NAME || DEFAULT_DATABASE_NAME;

    if (
        typeof databaseName !== 'string' ||
        !databaseName.trim()
    ) {
        throw new Error(
            'MONGODB_DATABASE_NAME must be a non-empty string.'
        );
    }

    return Object.freeze({
        uri: uri.trim(),

        databaseName: databaseName.trim(),

        options: Object.freeze({
            maxPoolSize: readInteger(
                'MONGODB_MAX_POOL_SIZE',
                10,
                1,
                100
            ),

            minPoolSize: readInteger(
                'MONGODB_MIN_POOL_SIZE',
                0,
                0,
                100
            ),

            serverSelectionTimeoutMS: readInteger(
                'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
                10000,
                1000,
                120000
            ),

            connectTimeoutMS: readInteger(
                'MONGODB_CONNECT_TIMEOUT_MS',
                10000,
                1000,
                120000
            ),

            socketTimeoutMS: readInteger(
                'MONGODB_SOCKET_TIMEOUT_MS',
                45000,
                1000,
                300000
            ),

            heartbeatFrequencyMS: 10000,

            autoIndex: false,

            bufferCommands: false
        })
    });
}

module.exports = {
    getDatabaseConfig
};
