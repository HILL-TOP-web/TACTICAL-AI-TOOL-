'use strict';

const mongoose = require('mongoose');
const Transaction = require('../database/models/Transaction');
const LedgerEntry = require('../database/models/LedgerEntry');

class TransactionRepository {
    async create(data, options = {}) {
        const transaction = new Transaction(data);

        await transaction.save({
            session: options.session
        });

        return transaction;
    }

    async findByReference(reference, options = {}) {
        return Transaction.findOne({
            reference
        })
            .session(options.session || null)
            .exec();
    }

    async findById(transactionId, options = {}) {
        if (!mongoose.isValidObjectId(transactionId)) {
            return null;
        }

        return Transaction.findById(transactionId)
            .session(options.session || null)
            .exec();
    }

    async findByIdempotencyKey(
        senderUserId,
        idempotencyKey,
        options = {}
    ) {
        if (!idempotencyKey) {
            return null;
        }

        return Transaction.findOne({
            senderUserId,
            idempotencyKey
        })
            .session(options.session || null)
            .exec();
    }

    async listByUser(userId, options = {}) {
        if (!mongoose.isValidObjectId(userId)) {
            return {
                items: [],
                total: 0,
                page: options.page || 1,
                limit: options.limit || 20
            };
        }

        const page = Math.max(
            1,
            Number.parseInt(options.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(
                1,
                Number.parseInt(options.limit, 10) || 20
            )
        );

        const filter = {
            $or: [
                { senderUserId: userId },
                { recipientUserId: userId }
            ]
        };

        const [items, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),

            Transaction.countDocuments(filter).exec()
        ]);

        return {
            items,
            total,
            page,
            limit
        };
    }

    async listLedgerEntries(transactionId, options = {}) {
        if (!mongoose.isValidObjectId(transactionId)) {
            return [];
        }

        return LedgerEntry.find({
            transactionId
        })
            .session(options.session || null)
            .sort({ createdAt: 1 })
            .exec();
    }
}

module.exports = new TransactionRepository();
module.exports.TransactionRepository = TransactionRepository;
