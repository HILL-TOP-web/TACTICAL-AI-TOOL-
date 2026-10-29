'use strict';

const LedgerEntry = require('../../database/models/LedgerEntry');

class LedgerService {
    async recordTransfer(
        {
            transactionId,
            senderWallet,
            recipientWallet,
            senderUserId,
            recipientUserId,
            currency,
            amount,
            reference
        },
        options = {}
    ) {
        if (!options.session) {
            throw new Error(
                'A MongoDB session is required to record ledger entries.'
            );
        }

        const session = options.session;

        const entries = [
            {
                transactionId,
                walletId: senderWallet._id,
                userId: senderUserId,
                currency,
                entryType: 'debit',
                amount,
                description: `Transfer debit ${reference}`
            },
            {
                transactionId,
                walletId: recipientWallet._id,
                userId: recipientUserId,
                currency,
                entryType: 'credit',
                amount,
                description: `Transfer credit ${reference}`
            }
        ];

        const created = await LedgerEntry.create(
            entries,
            { session }
        );

        return created;
    }

    async verifyTransfer(transactionId, options = {}) {
        const entries = await LedgerEntry.find({
            transactionId
        })
            .session(options.session || null)
            .exec();

        if (entries.length !== 2) {
            return {
                balanced: false,
                reason: 'Expected exactly two ledger entries.'
            };
        }

        const debits = entries.filter(
            (entry) => entry.entryType === 'debit'
        );

        const credits = entries.filter(
            (entry) => entry.entryType === 'credit'
        );

        if (debits.length !== 1 || credits.length !== 1) {
            return {
                balanced: false,
                reason: 'Transfer must contain one debit and one credit.'
            };
        }

        if (
            debits[0].currency !== credits[0].currency ||
            debits[0].amount.toString() !==
                credits[0].amount.toString()
        ) {
            return {
                balanced: false,
                reason: 'Debit and credit entries do not match.'
            };
        }

        return {
            balanced: true,
            currency: debits[0].currency,
            debit: debits[0].amount.toString(),
            credit: credits[0].amount.toString()
        };
    }
}

module.exports = new LedgerService();
module.exports.LedgerService = LedgerService;
