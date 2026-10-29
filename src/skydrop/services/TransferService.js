'use strict';

const mongoose = require('mongoose');

const transferEngine = require('../finance/transfers/TransferEngine');
const transactionRepository = require('../repositories/TransactionRepository');

class TransferService {
    async transfer({
        senderUserId,
        recipientUserId,
        currency,
        amount,
        description,
        idempotencyKey
    }) {
        if (!mongoose.isValidObjectId(senderUserId)) {
            const error = new Error('Authenticated sender is invalid.');
            error.code = 'INVALID_SENDER';
            throw error;
        }

        if (!mongoose.isValidObjectId(recipientUserId)) {
            const error = new Error('Recipient user ID is invalid.');
            error.code = 'INVALID_RECIPIENT';
            throw error;
        }

        const result = await transferEngine.executeTransfer({
            senderUserId,
            recipientUserId,
            currency,
            amount,
            description,
            idempotencyKey
        });

        const transaction = result.transaction;

        return {
            success: true,
            replayed: result.replayed,
            message: result.replayed
                ? 'Previously completed transfer returned.'
                : 'Transfer completed successfully.',
            transaction: {
                id: transaction._id,
                reference: transaction.reference,
                status: transaction.status,
                type: transaction.type,
                currency: transaction.currency,
                amount: transaction.amount.toString(),
                fee: transaction.fee.toString(),
                senderUserId: transaction.senderUserId,
                recipientUserId: transaction.recipientUserId,
                completedAt: transaction.completedAt
            }
        };
    }

    async getHistory(userId, options = {}) {
        if (!mongoose.isValidObjectId(userId)) {
            const error = new Error('Invalid authenticated user.');
            error.code = 'INVALID_USER';
            throw error;
        }

        return transactionRepository.listByUser(userId, options);
    }

    async getTransfer(userId, reference) {
        if (!mongoose.isValidObjectId(userId)) {
            const error = new Error('Invalid authenticated user.');
            error.code = 'INVALID_USER';
            throw error;
        }

        const transaction =
            await transactionRepository.findByReference(reference);

        if (!transaction) {
            const error = new Error('Transfer not found.');
            error.code = 'TRANSFER_NOT_FOUND';
            throw error;
        }

        const isParticipant =
            transaction.senderUserId?.toString() === userId.toString() ||
            transaction.recipientUserId?.toString() === userId.toString();

        if (!isParticipant) {
            const error = new Error('Transfer not found.');
            error.code = 'TRANSFER_NOT_FOUND';
            throw error;
        }

        return {
            reference: transaction.reference,
            status: transaction.status,
            currency: transaction.currency,
            amount: transaction.amount.toString(),
            fee: transaction.fee.toString(),
            description: transaction.description,
            completedAt: transaction.completedAt,
            createdAt: transaction.createdAt
        };
    }
}

module.exports = new TransferService();
module.exports.TransferService = TransferService;
