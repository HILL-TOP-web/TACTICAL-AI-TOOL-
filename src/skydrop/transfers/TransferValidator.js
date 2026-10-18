'use strict';

const crypto = require('node:crypto');

class TransferValidator {
    static validate(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('Invalid transfer request.');
        }

        const {
            userId,
            amountKobo,
            currency,
            destinationBankCode,
            destinationAccountNumber,
            idempotencyKey
        } = request;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('A valid user ID is required.');
        }

        if (
            !Number.isSafeInteger(amountKobo) ||
            amountKobo <= 0
        ) {
            throw new Error(
                'Transfer amount must be a positive integer in kobo.'
            );
        }

        if (currency !== 'NGN') {
            throw new Error(
                'This payout implementation supports NGN only.'
            );
        }

        if (
            typeof destinationBankCode !== 'string' ||
            !/^[0-9]{3,10}$/.test(destinationBankCode)
        ) {
            throw new Error('Invalid destination bank code.');
        }

        if (
            typeof destinationAccountNumber !== 'string' ||
            !/^[0-9]{10}$/.test(destinationAccountNumber)
        ) {
            throw new Error(
                'A valid 10-digit Nigerian account number is required.'
            );
        }

        if (
            typeof idempotencyKey !== 'string' ||
            idempotencyKey.length < 16 ||
            idempotencyKey.length > 128
        ) {
            throw new Error(
                'A valid idempotency key is required.'
            );
        }

        return {
            userId: userId.trim(),
            amountKobo,
            currency,
            destinationBankCode,
            destinationAccountNumber,
            idempotencyKey
        };
    }

    static createReference(prefix = 'SKD') {
        return `${prefix}_${crypto.randomUUID()}`;
    }
}

module.exports = TransferValidator;
