'use strict';

const crypto = require('node:crypto');

class Swap {
    constructor(options = {}) {
        this.exchangeRates = options.exchangeRates;
        this.walletIntegration = options.walletIntegration;
        this.transactionTracker = options.transactionTracker;
        this.repository = options.repository;

        this.feeRate = options.feeRate ?? 0;

        if (
            !this.exchangeRates ||
            !this.walletIntegration ||
            !this.transactionTracker ||
            !this.repository
        ) {
            throw new Error(
                'Swap requires exchangeRates, walletIntegration, ' +
                'transactionTracker and repository.'
            );
        }

        if (
            !Number.isFinite(this.feeRate) ||
            this.feeRate < 0 ||
            this.feeRate >= 1
        ) {
            throw new Error(
                'feeRate must be at least 0 and less than 1.'
            );
        }
    }

    async execute(request) {
        if (!request || typeof request !== 'object') {
            throw new Error(
                'A valid swap request is required.'
            );
        }

        const {
            userId,
            fromCurrency,
            toCurrency,
            amount,
            idempotencyKey
        } = request;

        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error(
                'A valid user ID is required.'
            );
        }

        if (
            typeof idempotencyKey !== 'string' ||
            !idempotencyKey.trim()
        ) {
            throw new Error(
                'An idempotency key is required.'
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
                'Provide two different currencies.'
            );
        }

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            throw new Error(
                'Swap amount must be positive.'
            );
        }

        const existing =
            await this.repository.findByIdempotencyKey(
                idempotencyKey
            );

        if (existing) {
            if (
                existing.userId !== userId.trim() ||
                existing.fromCurrency !== source ||
                existing.toCurrency !== destination ||
                existing.fromAmount !== numericAmount
            ) {
                throw new Error(
                    'Idempotency key was already used for another request.'
                );
            }

            return existing;
        }

        const calculation = this.exchangeRates.calculate(
            source,
            destination,
            numericAmount
        );

        const fee = calculation.result * this.feeRate;

        const outputAmount = calculation.result - fee;

        if (
            !Number.isFinite(outputAmount) ||
            outputAmount <= 0
        ) {
            throw new Error(
                'Swap output must be positive.'
            );
        }

        const transactionId = crypto.randomUUID();

        const transaction = this.transactionTracker.create({
            transactionId,
            userId: userId.trim(),
            fromCurrency: source,
            toCurrency: destination,
            fromAmount: numericAmount,
            toAmount: outputAmount,
            rate: calculation.rate,
            fee,
            idempotencyKey: idempotencyKey.trim()
        });

        await this.repository.create({
            ...transaction,
            rateTimestamp: calculation.rateTimestamp,
            status: 'pending'
        });

        let reserved = false;

        try {
            await this.walletIntegration.reserveFunds(
                userId,
                source,
                numericAmount,
                transactionId
            );

            reserved = true;

            this.transactionTracker.markProcessing(
                transactionId
            );

            await this.repository.updateStatus(
                transactionId,
                'processing'
            );

            await this.walletIntegration.settleExchange({
                userId: userId.trim(),
                fromCurrency: source,
                toCurrency: destination,
                fromAmount: numericAmount,
                toAmount: outputAmount,
                reference: transactionId
            });

            this.transactionTracker.markCompleted(
                transactionId
            );

            await this.repository.updateStatus(
                transactionId,
                'completed'
            );

            return {
                transactionId,
                userId: userId.trim(),
                fromCurrency: source,
                toCurrency: destination,
                fromAmount: numericAmount,
                toAmount: outputAmount,
                rate: calculation.rate,
                fee,
                status: 'completed'
            };
        } catch (error) {
            /*
             * Do not release funds automatically after an
             * uncertain settlement result. The wallet may
             * already have completed the exchange.
             *
             * Reconcile the transaction against authoritative
             * wallet records before retrying or refunding.
             */
            await this.repository.updateStatus(
                transactionId,
                'reconciliation_required',
                {
                    errorCode: 'SWAP_PROCESSING_ERROR'
                }
            );

            this.transactionTracker.markReconciliationRequired(
                transactionId
            );

            if (!reserved) {
                // No reservation succeeded, but the failure
                // must still be recorded for investigation.
            }

            throw error;
        }
    }
}

module.exports = Swap;
