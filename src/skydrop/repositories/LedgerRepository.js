'use strict';

const LedgerEntry = require('../models/LedgerEntry');

class LedgerRepository {
    async create(entryData, options = {}) {
        const entry = new LedgerEntry(entryData);

        await entry.save(options);

        return entry;
    }

    async createMany(entries, options = {}) {
        if (!Array.isArray(entries) || entries.length === 0) {
            throw new Error('At least one ledger entry is required.');
        }

        return LedgerEntry.insertMany(
            entries,
            {
                ordered: true,
                ...options
            }
        );
    }

    async findByEntryId(entryId, options = {}) {
        return LedgerEntry.findOne({
            entryId
        }, null, options);
    }

    async findByTransactionId(transactionId, options = {}) {
        return LedgerEntry.find({
            transactionId
        }, null, options).sort({
            createdAt: 1
        });
    }

    async findByWalletId(walletId, options = {}) {
        const {
            page = 1,
            limit = 50
        } = options;

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(
            100,
            Math.max(1, Number(limit) || 50)
        );

        return LedgerEntry.find({
            walletId
        })
            .sort({
                createdAt: -1
            })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .session(options.session || null);
    }

    async findByUserId(userId, options = {}) {
        const {
            page = 1,
            limit = 50
        } = options;

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(
            100,
            Math.max(1, Number(limit) || 50)
        );

        return LedgerEntry.find({
            userId
        })
            .sort({
                createdAt: -1
            })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .session(options.session || null);
    }

    async countByWalletId(walletId) {
        return LedgerEntry.countDocuments({
            walletId
        });
    }
}

module.exports = new LedgerRepository();
module.exports.LedgerRepository = LedgerRepository;
