'use strict';

const transferRepository = require('../repositories/TransferRepository');
const transferEngine = require('../finance/transfers/TransferEngine');

const { HttpError } = require('../api/utils/httpError');

module.exports = {
    async list(userId, query = {}) {
        const page = Number(query.page || 1);
        const limit = Number(query.limit || 20);

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            throw new HttpError(400, 'invalid-pagination');
        }

        return transferRepository.listForUser(
            userId,
            page,
            limit
        );
    },

    async create(userId, body = {}) {
        return transferEngine.execute({
            userId,
            amount: Number(body.amount),
            accountNumber: body.accountNumber,
            bankCode: body.bankCode,
            recipientName: body.recipientName,
            narration: String(body.narration || '').slice(0, 200)
        });
    }
};
