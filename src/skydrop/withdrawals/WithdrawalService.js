'use strict';

class WithdrawalService {
    constructor(withdrawalEngine) {
        if (!withdrawalEngine) {
            throw new Error('WithdrawalEngine is required.');
        }

        this.withdrawalEngine = withdrawalEngine;
    }

    async requestWithdrawal(request) {
        return this.withdrawalEngine.requestWithdrawal(request);
    }

    async getWithdrawal(reference, userId) {
        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            throw new Error('A valid withdrawal reference is required.');
        }

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        const repository =
            this.withdrawalEngine.withdrawalRepository;

        if (
            typeof repository.findByReferenceAndUser !== 'function'
        ) {
            throw new Error(
                'The repository must implement findByReferenceAndUser.'
            );
        }

        const withdrawal =
            await repository.findByReferenceAndUser(
                reference.trim(),
                userId.trim()
            );

        if (!withdrawal) {
            throw new Error('Withdrawal not found.');
        }

        return withdrawal;
    }

    getWithdrawalLimits() {
        const WithdrawalLimits = require('./WithdrawalLimits');

        return WithdrawalLimits.getLimits();
    }
}

module.exports = WithdrawalService;
