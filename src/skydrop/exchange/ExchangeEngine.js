'use strict';

const crypto = require('node:crypto');

const {
    skdToUsd
} = require('../conversion/conversionService');

function createExchangeEngine({
    transactionService,
    walletService,
    exchangeRepository
}) {
    if (!transactionService || !walletService) {
        throw new Error(
            'TransactionService and WalletService are required.'
        );
    }

    if (!exchangeRepository) {
        throw new Error(
            'An ExchangeRepository is required.'
        );
    }

    function assertExchangeEnabled() {
        if (
            process.env.SKYDROP_EXCHANGE_ENABLED !== 'true'
        ) {
            throw new Error(
                'Exchange is currently disabled.'
            );
        }
    }

    function assertTradingEnabled() {
        if (
            process.env.SKYDROP_TRADING_ENABLED !== 'true'
        ) {
            throw new Error(
                'TRADING STARTS ON THE 1st OF JANUARY 2027 AT 10:00 AM'
            );
        }
    }

    function getAllowedAssets() {
        return (
            process.env.SKYDROP_EXCHANGE_ALLOWED_ASSETS ||
            'SKD,USDT'
        )
            .split(',')
            .map(asset => asset.trim().toUpperCase())
            .filter(Boolean);
    }

    async function createOrder({
        userId,
        side,
        asset,
        amount
    }) {
        assertExchangeEnabled();
        assertTradingEnabled();

        const normalizedSide =
            String(side || '').toUpperCase();

        const normalizedAsset =
            String(asset || '').toUpperCase();

        if (!['BUY', 'SELL'].includes(normalizedSide)) {
            throw new Error(
                'Exchange side must be BUY or SELL.'
            );
        }

        if (!getAllowedAssets().includes(normalizedAsset)) {
            throw new Error(
                'This exchange asset is not supported.'
            );
        }

        const quantity = Number(amount);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error('Invalid exchange amount.');
        }

        const reference =
            `SDE-${crypto.randomUUID()}`;

        /*
         * The repository must persist an order with a unique
         * reference and idempotency constraints.
         *
         * Execution must be handled by a real matching engine
         * or verified liquidity provider. Do not treat this
         * order record as a completed trade.
         */
        return exchangeRepository.createOrder({
            userId,
            reference,
            side: normalizedSide,
            asset: normalizedAsset,
            amount: quantity,
            status: 'PENDING'
        });
    }

    async function estimateSkdValue(skdAmount) {
        assertExchangeEnabled();

        return {
            asset: 'SKD',
            amount: Number(skdAmount),
            estimatedUsd: skdToUsd(skdAmount),
            executable: false
        };
    }

    return {
        createOrder,
        estimateSkdValue
    };
}

module.exports = {
    createExchangeEngine
};
