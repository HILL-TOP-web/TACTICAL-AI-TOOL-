'use strict';

class WalletIntegration {
    constructor(options = {}) {
        this.walletManager = options.walletManager;

        if (!this.walletManager) {
            throw new Error(
                'A walletManager dependency is required.'
            );
        }
    }

    validateUserId(userId) {
        if (
            typeof userId !== 'string' ||
            userId.trim().length === 0
        ) {
            throw new Error(
                'A valid user ID is required.'
            );
        }

        return userId.trim();
    }

    normalizeCurrency(currency) {
        if (typeof currency !== 'string') {
            throw new Error(
                'Currency must be a string.'
            );
        }

        const normalized = currency.trim().toUpperCase();

        if (!/^[A-Z0-9]{2,12}$/.test(normalized)) {
            throw new Error(
                'Invalid currency code.'
            );
        }

        return normalized;
    }

    validateAmount(amount) {
        const value = Number(amount);

        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {
            throw new Error(
                'Amount must be a positive finite number.'
            );
        }

        return value;
    }

    async getBalance(userId, currency) {
        const user = this.validateUserId(userId);
        const asset = this.normalizeCurrency(currency);

        if (
            typeof this.walletManager.getBalance !== 'function'
        ) {
            throw new Error(
                'Wallet manager does not implement getBalance().'
            );
        }

        const balance = await this.walletManager.getBalance(
            user,
            asset
        );

        const numericBalance = Number(balance);

        if (
            !Number.isFinite(numericBalance) ||
            numericBalance < 0
        ) {
            throw new Error(
                'Wallet returned an invalid balance.'
            );
        }

        return numericBalance;
    }

    async reserveFunds(
        userId,
        currency,
        amount,
        reference
    ) {
        const user = this.validateUserId(userId);
        const asset = this.normalizeCurrency(currency);
        const value = this.validateAmount(amount);

        if (
            typeof reference !== 'string' ||
            reference.trim().length === 0
        ) {
            throw new Error(
                'A reservation reference is required.'
            );
        }

        if (
            typeof this.walletManager.reserveFunds !==
            'function'
        ) {
            throw new Error(
                'Wallet manager must implement reserveFunds().'
            );
        }

        return this.walletManager.reserveFunds({
            userId: user,
            currency: asset,
            amount: value,
            reference: reference.trim()
        });
    }

    async releaseFunds(
        userId,
        currency,
        amount,
        reference
    ) {
        const user = this.validateUserId(userId);
        const asset = this.normalizeCurrency(currency);
        const value = this.validateAmount(amount);

        if (
            typeof this.walletManager.releaseFunds !==
            'function'
        ) {
            throw new Error(
                'Wallet manager must implement releaseFunds().'
            );
        }

        return this.walletManager.releaseFunds({
            userId: user,
            currency: asset,
            amount: value,
            reference
        });
    }

    async settleExchange({
        userId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        reference
    }) {
        const user = this.validateUserId(userId);

        const source = this.normalizeCurrency(fromCurrency);
        const destination = this.normalizeCurrency(toCurrency);

        const sourceAmount = this.validateAmount(fromAmount);
        const destinationAmount = this.validateAmount(toAmount);

        if (source === destination) {
            throw new Error(
                'Exchange currencies must differ.'
            );
        }

        if (
            typeof this.walletManager.settleExchange !==
            'function'
        ) {
            throw new Error(
                'Wallet manager must implement settleExchange().'
            );
        }

        return this.walletManager.settleExchange({
            userId: user,
            fromCurrency: source,
            toCurrency: destination,
            fromAmount: sourceAmount,
            toAmount: destinationAmount,
            reference
        });
    }
}

module.exports = WalletIntegration;
