'use strict';

const crypto = require('node:crypto');

class ExchangeLedger {
    constructor(options = {}) {
        this.repository = options.repository;
        this.clock = options.clock || (() => Date.now());

        if (!this.repository) {
            throw new Error(
                'ExchangeLedger requires a repository.'
            );
        }

        if (
            typeof this.repository.appendEntry !== 'function'
        ) {
            throw new Error(
                'Ledger repository must implement appendEntry().'
            );
        }

        if (
            typeof this.repository.findByReference !==
            'function'
        ) {
            throw new Error(
                'Ledger repository must implement findByReference().'
            );
        }
    }

    validateAmount(amount) {
        const value = Number(amount);

        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {
            throw new Error(
                'Ledger amount must be positive.'
            );
        }

        return value;
    }

    async recordExchange({
        transactionId,
        userId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        fee = 0
    }) {
        if (
            typeof transactionId !== 'string' ||
            !transactionId.trim()
        ) {
            throw new Error(
                'Transaction ID is required.'
            );
        }

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error(
                'User ID is required.'
            );
        }

        const source = String(fromCurrency || '')
            .trim()
            .toUpperCase();

        const destination = String(toCurrency || '')
            .trim()
            .toUpperCase();

        if (
            !source ||
            !destination ||
            source === destination
        ) {
            throw new Error(
                'Ledger currencies must be different.'
            );
        }

        const sourceAmount = this.validateAmount(fromAmount);
        const destinationAmount = this.validateAmount(toAmount);

        const feeAmount = Number(fee);

        if (
            !Number.isFinite(feeAmount) ||
            feeAmount < 0
        ) {
            throw new Error(
                'Ledger fee cannot be negative.'
            );
        }

        const existing =
            await this.repository.findByReference(
                transactionId
            );

        if (existing) {
            return existing;
        }

        const entry = {
            entryId: crypto.randomUUID(),
            transactionId: transactionId.trim(),
            userId: userId.trim(),
            type: 'exchange',
            status: 'recorded',
            movements: [
                {
                    currency: source,
                    direction: 'debit',
                    amount: sourceAmount
                },
                {
                    currency: destination,
                    direction: 'credit',
                    amount: destinationAmount
                }
            ],
            fee: {
                currency: destination,
                amount: feeAmount
            },
            createdAt: this.clock()
        };

        /*
         * appendEntry must atomically enforce uniqueness
         * for transactionId and use durable storage.
         */
        return this.repository.appendEntry(entry);
    }

    async getByTransactionId(transactionId) {
        if (
            typeof transactionId !== 'string' ||
            !transactionId.trim()
        ) {
            throw new Error(
                'Transaction ID is required.'
            );
        }

        return this.repository.findByReference(
            transactionId.trim()
        );
    }
}

module.exports = ExchangeLedger;
