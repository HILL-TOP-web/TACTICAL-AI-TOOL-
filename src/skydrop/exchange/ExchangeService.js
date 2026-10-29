'use strict';

function createExchangeService({
    exchangeEngine,
    exchangeRepository
}) {
    if (!exchangeEngine || !exchangeRepository) {
        throw new Error(
            'ExchangeEngine and ExchangeRepository are required.'
        );
    }

    async function placeOrder(input) {
        return exchangeEngine.createOrder(input);
    }

    async function getOrder(reference, userId) {
        const order =
            await exchangeRepository.findByReference(
                reference
            );

        if (!order) {
            return null;
        }

        if (
            String(order.userId) !== String(userId)
        ) {
            throw new Error('Access denied.');
        }

        return order;
    }

    async function listOrders(userId, limit = 20) {
        const safeLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        return exchangeRepository.findByUser(
            userId,
            safeLimit
        );
    }

    async function estimateSkdValue(amount) {
        return exchangeEngine.estimateSkdValue(amount);
    }

    return {
        placeOrder,
        getOrder,
        listOrders,
        estimateSkdValue
    };
}

module.exports = {
    createExchangeService
};
