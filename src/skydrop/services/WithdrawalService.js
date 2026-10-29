'use strict';

const withdrawalRepository = require('../repositories/WithdrawalRepository');
const withdrawalEngine = require('../finance/withdrawals/WithdrawalEngine');

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

        return withdrawalRepository.listForUser(
            userId,
            page,
            limit
        );
    },

    async create(userId, body = {}) {
        return withdrawalEngine.request({
            userId,
            amount: Number(body.amount),
            accountNumber: body.accountNumber,
            bankCode: body.bankCode,
            accountName: body.accountName
        });
    },

    async reconcile() {
        return withdrawalEngine.reconcilePending();
    }
};
