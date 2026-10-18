'use strict';

class TransferService {
    constructor({ transferEngine }) {
        if (!transferEngine) {
            throw new Error('transferEngine is required.');
        }

        this.transferEngine = transferEngine;
    }

    async requestMonnifyTransfer({
        userId,
        amountKobo,
        bankCode,
        accountNumber,
        idempotencyKey
    }) {
        return this.transferEngine.requestTransfer({
            userId,
            amountKobo,
            currency: 'NGN',
            destinationBankCode: bankCode,
            destinationAccountNumber: accountNumber,
            idempotencyKey,
            provider: 'monnify'
        });
    }
}

module.exports = TransferService;
