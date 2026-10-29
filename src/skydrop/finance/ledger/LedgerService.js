'use strict';

const LedgerEntry = require('../../database/models/LedgerEntry');
const Transaction = require('../../database/models/Transaction');

async function record({
    userId,
    walletId,
    transactionId,
    reference,
    currency,
    amount,
    direction,
    balanceAfter,
    description,
    session
}) {
    if (!transactionId) {
        throw new Error('transactionId is required for ledger entries');
    }

    if (!['debit', 'credit'].includes(direction)) {
        throw new Error('Invalid ledger direction');
    }

    const transactionQuery = Transaction.findOne({
        _id: transactionId,
        userId,
        reference
    });

    if (session) {
        transactionQuery.session(session);
    }

    const transaction = await transactionQuery;

    if (!transaction) {
        throw new Error('Ledger transaction reference was not found');
    }

    const entry = {
        userId,
        walletId,
        transactionId,
        reference,
        entryType: direction,
        amount,
        currency,
        balanceAfter,
        description: description || ''
    };

    const options = session ? { session } : {};

    const created = await LedgerEntry.create(
        [entry],
        options
    );

    return created[0];
}

module.exports = {
    record
};
