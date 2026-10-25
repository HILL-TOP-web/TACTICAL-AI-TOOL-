'use strict';

const WithdrawalLimits = require('./WithdrawalLimits');

class WithdrawalValidator {
    static validate(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('A valid withdrawal request is required.');
        }

        const {
            userId,
            amount,
            method,
            accountNumber,
            accountName,
            bankCode,
            idempotencyKey
        } = request;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        WithdrawalLimits.validateAmount(amount);

        if (
            typeof method !== 'string' ||
            !['monnify', 'bank'].includes(
                method.trim().toLowerCase()
            )
        ) {
            throw new Error(
                'Withdrawal method must be monnify or bank.'
            );
        }

        if (
            typeof accountNumber !== 'string' ||
            !/^\d{10}$/.test(accountNumber.trim())
        ) {
            throw new Error(
                'A valid 10-digit recipient account number is required.'
            );
        }

        if (
            typeof accountName !== 'string' ||
            accountName.trim().length < 2
        ) {
            throw new Error(
                'A valid recipient account name is required.'
            );
        }

        if (
            typeof bankCode !== 'string' ||
            !/^[A-Za-z0-9_-]{2,20}$/.test(bankCode.trim())
        ) {
            throw new Error('A valid bank code is required.');
        }

        if (
            typeof idempotencyKey !== 'string' ||
            !/^[A-Za-z0-9_-]{16,128}$/.test(
                idempotencyKey
            )
        ) {
            throw new Error(
                'A valid idempotency key between 16 and 128 characters is required.'
            );
        }

        return {
            userId: userId.trim(),
            amount,
            currency: 'NGN',
            method: method.trim().toLowerCase(),
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim(),
            bankCode: bankCode.trim(),
            idempotencyKey
        };
    }
}

module.exports = WithdrawalValidator;
