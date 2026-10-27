'use strict';

require('dotenv').config();

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

let client;
let db;
let connectionPromise;

async function connect() {
  if (db) {
    return db;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    if (!uri || !uri.trim()) {
      throw new Error('MONGODB_URI is missing from .env.');
    }

    if (!databaseName || !databaseName.trim()) {
      throw new Error('MONGODB_DATABASE is missing from .env.');
    }

    client = new MongoClient(uri, {
      appName: 'Tactical-AI-SkyDrop',
      retryWrites: true,
      maxPoolSize: 10
    });

    await client.connect();

    db = client.db(databaseName);

    await db.command({ ping: 1 });

    return db;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    if (client) {
      await client.close().catch(() => {});
    }

    client = undefined;
    db = undefined;
    connectionPromise = undefined;

    throw error;
  }
}

async function getDb() {
  if (!db) {
    await connect();
  }

  return db;
}

async function withTransaction(callback) {
  await connect();

  const session = client.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}

async function close() {
  if (client) {
    await client.close();
  }

  client = undefined;
  db = undefined;
  connectionPromise = undefined;
}

module.exports = {
  connect,
  getDb,
  withTransaction,
  close
};
