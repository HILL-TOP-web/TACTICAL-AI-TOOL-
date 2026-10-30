'use strict';

const TransactionConfig = Object.freeze({

    CURRENCY: Object.freeze({
        NGN: 'NGN',
        USD: 'USD',
        SKD: 'SKD',
        USDT: 'USDT'
    }),

    STATUS: Object.freeze({
        PENDING: 'PENDING',
        PROCESSING: 'PROCESSING',
        SUCCESSFUL: 'SUCCESSFUL',
        FAILED: 'FAILED',
        REVERSED: 'REVERSED',
        UNKNOWN: 'UNKNOWN'
    }),

    TYPES: Object.freeze({
        DEPOSIT: 'DEPOSIT',
        WITHDRAWAL: 'WITHDRAWAL',
        TRANSFER: 'TRANSFER',
        MINING: 'MINING',
        EXCHANGE: 'EXCHANGE',
        REVERSAL: 'REVERSAL'
    }),

    MIN_WITHDRAWAL_NGN:
        Number(process.env.SKYDROP_MIN_WITHDRAWAL_NGN || 100),

    IDEMPOTENCY_REQUIRED: true,

    REQUIRE_LEDGER_ENTRIES: true
});

module.exports = TransactionConfig;
