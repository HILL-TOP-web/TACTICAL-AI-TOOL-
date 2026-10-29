'use strict';

const mongoose = require('mongoose');

async function connectMongo() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is required');
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    return mongoose.connection;
}

module.exports = {
    mongoose,
    connectMongo
};
