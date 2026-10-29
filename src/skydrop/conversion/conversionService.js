'use strict';

function getConversionConfig() {
    const skdUsdRate = Number(
        process.env.SKD_USD_RATE || 200000000
    );

    const usdNgnRate = Number(
        process.env.USD_NGN_RATE || 2000
    );

    if (
        !Number.isFinite(skdUsdRate) ||
        skdUsdRate <= 0
    ) {
        throw new Error('Invalid SKD/USD conversion rate.');
    }

    if (
        !Number.isFinite(usdNgnRate) ||
        usdNgnRate <= 0
    ) {
        throw new Error('Invalid USD/NGN conversion rate.');
    }

    return {
        skdUsdRate,
        usdNgnRate
    };
}

function toFiniteNumber(value, label) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        throw new Error(`Invalid ${label} amount.`);
    }

    return number;
}

function skdToUsd(skdAmount) {
    const amount = toFiniteNumber(
        skdAmount,
        'SKD'
    );

    const { skdUsdRate } = getConversionConfig();

    return amount * skdUsdRate;
}

function usdToNgn(usdAmount) {
    const amount = toFiniteNumber(
        usdAmount,
        'USD'
    );

    const { usdNgnRate } = getConversionConfig();

    return amount * usdNgnRate;
}

function skdToNgn(skdAmount) {
    return usdToNgn(
        skdToUsd(skdAmount)
    );
}

function usdToSkd(usdAmount) {
    const amount = toFiniteNumber(
        usdAmount,
        'USD'
    );

    const { skdUsdRate } = getConversionConfig();

    return amount / skdUsdRate;
}

function formatMoney(amount, decimals = 2) {
    if (!Number.isFinite(amount)) {
        throw new Error('Invalid monetary value.');
    }

    return Number(amount.toFixed(decimals));
}

module.exports = {
    getConversionConfig,
    skdToUsd,
    usdToNgn,
    skdToNgn,
    usdToSkd,
    formatMoney
};
