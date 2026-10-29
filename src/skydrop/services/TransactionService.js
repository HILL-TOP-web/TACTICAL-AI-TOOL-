'use strict';

const mongoose = require('mongoose');
const transactionRepository = require('../repositories/TransactionRepository');

class TransactionService {
    validateUserId(userId) {
        if (!mongoose.isValidObjectId(userId)) {
            const error = new Error('Invalid authenticated user.');
            error.code = 'INVALID_USER';
            throw error;
        }
    }

    async getHistory(userId, options = {}) {
        this.validateUserId(userId);

        return transactionRepository.listByUser(
            userId,
            options
        );
    }

    async getTransaction(userId, reference) {
        this.validateUserId(userId);

        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            const error = new Error(
                'A transaction reference is required.'
            );

            error.code = 'INVALID_REFERENCE';

            throw error;
        }

        const transaction =
            await transactionRepository.findByReference(
                reference.trim()
            );

        if (!transaction) {
            const error = new Error('Transaction not found.');
            error.code = 'TRANSACTION_NOT_FOUND';
            throw error;
        }

        const isParticipant =
            transaction.senderUserId?.toString() === userId.toString() ||
            transaction.recipientUserId?.toString() === userId.toString();

        if (!isParticipant) {
            const error = new Error('Transaction not found.');
            error.code = 'TRANSACTION_NOT_FOUND';
            throw error;
        }

        return transaction;
    }
}

module.exports = new TransactionService();
module.exports.TransactionService = TransactionService;
