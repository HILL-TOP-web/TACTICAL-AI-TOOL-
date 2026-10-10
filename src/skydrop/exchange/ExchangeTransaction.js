'use strict';

const crypto = require('node:crypto');

class ExchangeTransaction {
    constructor(options = {}) {
        this.clock = options.clock || (() => Date.now());

        this.transactions = new Map();
    }

    create(data) {
        if (!data || typeof data !== 'object') {
            throw new Error(
                'Transaction data is required.'
            );
        }

        const transactionId =
            data.transactionId || crypto.randomUUID();

        if (this.transactions.has(transactionId)) {
            throw new Error(
                'Transaction ID already exists.'
            );
        }

        const transaction = {
            transactionId,
            userId: data.userId,
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            fromAmount: Number(data.fromAmount),
            toAmount: Number(data.toAmount),
            rate: Number(data.rate),
            fee: Number(data.fee ?? 0),
            idempotencyKey: data.idempotencyKey,
            status: 'pending',
            createdAt: this.clock(),
            updatedAt: this.clock(),
            errorCode: null
        };

        this.validateTransaction(transaction);

        this.transactions.set(
            transactionId,
            transaction
        );

        return { ...transaction };
    }

    validateTransaction(transaction) {
        if (
            typeof transaction.userId !== 'string' ||
            !transaction.userId.trim()
        ) {
            throw new Error(
                'Transaction user ID is required.'
            );
        }

        if (
            !transaction.fromCurrency ||
            !transaction.toCurrency ||
            transaction.fromCurrency === transaction.toCurrency
        ) {
            throw new Error(
                'Transaction currencies are invalid.'
            );
        }

        if (
            !Number.isFinite(transaction.fromAmount) ||
            transaction.fromAmount <= 0
        ) {
            throw new Error(
                'Transaction source amount is invalid.'
            );
        }

        if (
            !Number.isFinite(transaction.toAmount) ||
            transaction.toAmount <= 0
        ) {
            throw new Error(
                'Transaction destination amount is invalid.'
            );
        }

        if (
            !Number.isFinite(transaction.rate) ||
            transaction.rate <= 0
        ) {
            throw new Error(
                'Transaction exchange rate is invalid.'
            );
        }

        if (
            !Number.isFinite(transaction.fee) ||
            transaction.fee < 0
        ) {
            throw new Error(
                'Transaction fee is invalid.'
            );
        }
    }

    get(transactionId) {
        const transaction =
            this.transactions.get(transactionId);

        return transaction
            ? { ...transaction }
            : null;
    }

    transition(transactionId, nextStatus, details = {}) {
        const transaction =
            this.transactions.get(transactionId);

        if (!transaction) {
            throw new Error(
                'Transaction not found.'
            );
        }

        const transitions = {
            pending: [
                'processing',
                'failed',
                'reconciliation_required'
            ],
            processing: [
                'completed',
                'failed',
                'reconciliation_required'
            ],
            reconciliation_required: [
                'completed',
                'failed'
            ],
            completed: [],
            failed: []
        };

        const allowed = transitions[transaction.status];

        if (!allowed || !allowed.includes(nextStatus)) {
            throw new Error(
                `Invalid transaction transition: ` +
                `${transaction.status} -> ${nextStatus}.`
            );
        }

        transaction.status = nextStatus;
        transaction.updatedAt = this.clock();

        if (details.errorCode) {
            transaction.errorCode = details.errorCode;
        }

        return { ...transaction };
    }

    markProcessing(transactionId) {
        return this.transition(
            transactionId,
            'processing'
        );
    }

    markCompleted(transactionId) {
        return this.transition(
            transactionId,
            'completed'
        );
    }

    markFailed(transactionId, errorCode) {
        return this.transition(
            transactionId,
            'failed',
            { errorCode }
        );
    }

    markReconciliationRequired(transactionId) {
        return this.transition(
            transactionId,
            'reconciliation_required',
            {
                errorCode: 'RECONCILIATION_REQUIRED'
            }
        );
    }

    listByUser(userId) {
        return Array.from(this.transactions.values())
            .filter(transaction =>
                transaction.userId === userId
            )
            .map(transaction => ({ ...transaction }));
    }
}

module.exports = ExchangeTransaction;
