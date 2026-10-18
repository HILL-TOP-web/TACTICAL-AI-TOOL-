'use strict';

const ExchangeConfig = Object.freeze({
    enabled: true,

    baseCurrency: 'SKD',

    supportedCurrencies: Object.freeze([
        'SKD',
        'USD',
        'NGN',
        'USDT'
    ]),

    trading: Object.freeze({
        enabled: true,

        startsAt: '2027-01-01T10:00:00',

        timeZone: process.env.SKYDROP_TRADING_TIME_ZONE || 'Africa/Lagos',

        errorCode: 'trading-disabled',

        message:
            'Trading starts on 1 January 2027 at 10:00 AM.'
    }),

    minimumExchangeAmount: 0.00001,

    maximumExchangeAmount: 1000000
});

module.exports = ExchangeConfig;
