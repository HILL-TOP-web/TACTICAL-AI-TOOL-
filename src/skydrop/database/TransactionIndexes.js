'use strict';

const DatabaseConnection = require('./DatabaseConnection');

async function ensureTransactionIndexes() {
  const db = await DatabaseConnection.getDb();

  const transactions = db.collection(
    'skydrop_transactions'
  );

  await transactions.createIndex(
    { reference: 1 },
    {
      unique: true,
      name: 'unique_transaction_reference'
    }
  );

  await transactions.createIndex(
    {
      userId: 1,
      idempotencyKey: 1
    },
    {
      unique: true,
      name: 'unique_user_idempotency_key'
    }
  );

  await transactions.createIndex(
    {
      userId: 1,
      createdAt: -1
    },
    {
      name: 'user_transaction_history'
    }
  );

  await transactions.createIndex(
    {
      status: 1,
      updatedAt: -1
    },
    {
      name: 'transaction_status_lookup'
    }
  );

  return {
    success: true,
    collection: 'skydrop_transactions',
    indexesCreated: 4
  };
}

module.exports = ensureTransactionIndexes;
