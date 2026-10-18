'use strict';

class BankAccounts {
    static validateDestination({
        bankCode,
        accountNumber
    }) {
        if (
            typeof bankCode !== 'string' ||
            !/^[0-9]{3,10}$/.test(bankCode)
        ) {
            throw new Error('Invalid bank code.');
        }

        if (
            typeof accountNumber !== 'string' ||
            !/^[0-9]{10}$/.test(accountNumber)
        ) {
            throw new Error(
                'Nigerian bank account numbers must contain 10 digits.'
            );
        }

        return {
            bankCode,
            accountNumber
        };
    }
}

module.exports = BankAccounts;
