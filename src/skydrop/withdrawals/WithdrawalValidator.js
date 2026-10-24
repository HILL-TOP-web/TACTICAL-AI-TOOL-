'use strict';

const WithdrawalLimits = require('./WithdrawalLimits');
const WithdrawalMethods = require('./WithdrawalMethods');

const WithdrawalLimitsManager =
    WithdrawalLimits.WithdrawalLimitsManager;

const WithdrawalMethodsManager =
    WithdrawalMethods.WithdrawalMethodsManager;

class WithdrawalValidator {
    static validate(request) {
        if (
            !request ||
            typeof request !== 'object' ||
            Array.isArray(request)
        ) {
            throw new Error('Invalid withdrawal request.');
        }

        const {
            userId,
            amount,
            currency,
            method,
            recipient,
            idempotencyKey
        } = request;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error(
                'Withdrawal amount must be a positive number.'
            );
        }

        if (currency !== 'NGN') {
            throw new Error(
                'Only NGN withdrawals are supported by this gateway.'
            );
        }

        WithdrawalLimitsManager.validateAmount(amount);

        const normalizedMethod =
            WithdrawalMethodsManager.normalize(method);

        WithdrawalMethodsManager.assertValid(normalizedMethod);

        if (
            typeof idempotencyKey !== 'string' ||
            !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)
        ) {
            throw new Error(
                'A valid idempotency key of 16–128 characters is required.'
            );
        }

        if (
            !recipient ||
            typeof recipient !== 'object' ||
            Array.isArray(recipient)
        ) {
            throw new Error('Recipient details are required.');
        }

        const normalizedRecipient =
            this.validateRecipient(recipient);

        return Object.freeze({
            userId: userId.trim(),
            amount,
            currency,
            method: normalizedMethod,
            recipient: normalizedRecipient,
            idempotencyKey
        });
    }

    static validateRecipient(recipient) {
        const {
            accountName,
            accountNumber,
            bankCode
        } = recipient;

        if (
            typeof accountName !== 'string' ||
            !accountName.trim()
        ) {
            throw new Error(
                'Recipient account name is required.'
            );
        }

        if (
            typeof accountNumber !== 'string' ||
            !/^\d{10}$/.test(accountNumber)
        ) {
            throw new Error(
                'Recipient account number must contain 10 digits.'
            );
        }

        if (
            typeof bankCode !== 'string' ||
            !/^[A-Za-z0-9_-]{2,20}$/.test(bankCode)
        ) {
            throw new Error(
                'A valid recipient bank code is required.'
            );
        }

        return Object.freeze({
            accountName: accountName.trim(),
            accountNumber,
            bankCode: bankCode.trim()
        });
    }
}

module.exports = WithdrawalValidator;
