// tactical-ai/src/skydrop/exchange/exchangeConfig.js

require("dotenv").config();

module.exports = Object.freeze({
    TRADING_ENABLED: process.env.TRADING_ENABLED === "true",

    TRADING_START_DATE: "2027-01-01T10:00:00+01:00",

    SUPPORTED_CURRENCIES: ["SKD", "USDT"],

    DEFAULT_CURRENCY: "USDT",

    MINIMUM_EXCHANGE_AMOUNT: 0.00001
});
