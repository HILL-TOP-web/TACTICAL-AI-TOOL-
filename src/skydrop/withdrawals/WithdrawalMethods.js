'use strict';

const WithdrawalMethods = Object.freeze({
    BANK_TRANSFER: 'bank_transfer',
    MONNIFY: 'monnify'
});

class WithdrawalMethodsManager {
    static getAll() {
        return Object.values(WithdrawalMethods);
    }

    static isValid(method) {
        return this.getAll().includes(method);
    }

    static assertValid(method) {
        if (!this.isValid(method)) {
            throw new Error('Unsupported withdrawal method.');
        }
    }

    static normalize(method) {
        if (typeof method !== 'string') {
            throw new Error('Withdrawal method is required.');
        }

        return method.trim().toLowerCase();
    }

    static getDisplayName(method) {
        const names = {
            [WithdrawalMethods.BANK_TRANSFER]: 'Bank Transfer',
            [WithdrawalMethods.MONNIFY]: 'Monnify'
        };

        return names[method] || 'Unknown Method';
    }
}

module.exports = WithdrawalMethods;

module.exports.WithdrawalMethodsManager =
    WithdrawalMethodsManager;
