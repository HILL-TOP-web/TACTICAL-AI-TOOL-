'use strict';

const WithdrawalValidator = require('./WithdrawalValidator');

class WithdrawalService {
    constructor(options = {}) {
        this.engine = options.engine;
        this.repository = options.repository;

        if (
            !this.engine ||
            typeof this.engine.requestWithdrawal !== 'function' ||
            typeof this.engine.getWithdrawal !== 'function'
        ) {
            throw new Error(
                'WithdrawalService requires a compatible WithdrawalEngine.'
            );
        }
    }

    async requestWithdrawal(input) {
        const validatedRequest =
            WithdrawalValidator.validate(input);

        return this.engine.requestWithdrawal(
            validatedRequest
        );
    }

    async getWithdrawal(withdrawalId, userId) {
        return this.engine.getWithdrawal(
            withdrawalId,
            userId
        );
    }

    async getWithdrawalHistory(userId, options = {}) {
        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            !this.repository ||
            typeof this.repository.findByUserId !== 'function'
        ) {
            throw new Error(
                'Withdrawal history repository is not configured.'
            );
        }

        const limit = options.limit === undefined
            ? 20
            : options.limit;

        const offset = options.offset === undefined
            ? 0
            : options.offset;

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            throw new Error(
                'History limit must be between 1 and 100.'
            );
        }

        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            throw new Error(
                'History offset must be zero or greater.'
            );
        }

        return this.repository.findByUserId(
            userId.trim(),
            {
                limit,
                offset
            }
        );
    }
}

module.exports = WithdrawalService;
