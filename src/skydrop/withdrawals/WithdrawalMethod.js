'use strict';

const WithdrawalMethod = Object.freeze({
    MONNIFY: 'monnify',
    BANK: 'bank'
});

class WithdrawalMethodManager {
    static getAvailableMethods() {
        return [
            {
                id: WithdrawalMethod.MONNIFY,
                name: 'Monnify',
                currency: 'NGN',
                enabled: process.env.MONNIFY_ENABLED === 'true'
                    && process.env.SKYDROP_WITHDRAWALS_ENABLED === 'true'
            },
            {
                id: WithdrawalMethod.BANK,
                name: 'Bank Transfer',
                currency: 'NGN',
                enabled: process.env.SKYDROP_BANK_WITHDRAWALS_ENABLED === 'true'
                    && process.env.SKYDROP_WITHDRAWALS_ENABLED === 'true'
            }
        ];
    }

    static getEnabledMethods() {
        return this.getAvailableMethods().filter(
            method => method.enabled
        );
    }

    static isSupported(method) {
        if (typeof method !== 'string') {
            return false;
        }

        return Object.values(WithdrawalMethod).includes(
            method.trim().toLowerCase()
        );
    }

    static isEnabled(method) {
        if (!this.isSupported(method)) {
            return false;
        }

        const normalizedMethod = method.trim().toLowerCase();

        return this.getEnabledMethods().some(
            availableMethod => availableMethod.id === normalizedMethod
        );
    }

    static validateMethod(method) {
        if (!this.isSupported(method)) {
            throw new Error(
                'Unsupported withdrawal method. Choose Monnify or Bank Transfer.'
            );
        }

        if (!this.isEnabled(method)) {
            throw new Error(
                'This withdrawal method is currently disabled.'
            );
        }

        return method.trim().toLowerCase();
    }
}

module.exports = {
    WithdrawalMethod,
    WithdrawalMethodManager
};
