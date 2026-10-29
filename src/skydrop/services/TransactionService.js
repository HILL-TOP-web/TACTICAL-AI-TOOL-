'use strict';

const transactionRepository = require('../repositories/TransactionRepository');

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

        return transactionRepository.listForUser(
            userId,
            page,
            limit
        );
    }
};
