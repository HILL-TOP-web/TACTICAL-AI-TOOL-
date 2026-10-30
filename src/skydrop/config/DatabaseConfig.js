'use strict';

class DatabaseConfig {

    getConfig() {

        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error('MONGODB_URI is required.');
        }

        return {
            uri,
            options: {
                autoIndex: process.env.NODE_ENV !== 'production',
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 20,
                minPoolSize: 2
            }
        };
    }
}

module.exports = new DatabaseConfig();
