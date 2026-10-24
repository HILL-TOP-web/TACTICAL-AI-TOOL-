'use strict';

require('dotenv').config();

const DEFAULTS = Object.freeze({
    BASE_RATE: 0.00001,
    INTERVAL_MS: 5 * 60 * 1000,
    MAX_SESSION_MS: 24 * 60 * 60 * 1000,
    MAX_CLAIM_AMOUNT: 1000000,
    DECIMAL_PLACES: 12,
    MAX_ACTIVE_SESSIONS: 1
});

function readNumber(name, fallback, options = {}) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isFinite(value)) {
        throw new Error(
            `Invalid environment variable: ${name}`
        );
    }

    if (options.min !== undefined && value < options.min) {
        throw new Error(
            `Environment variable ${name} is below its minimum`
        );
    }

    if (options.max !== undefined && value > options.max) {
        throw new Error(
            `Environment variable ${name} exceeds its maximum`
        );
    }

    return value;
}

const MiningConfig = Object.freeze({
    enabled: process.env.MINING_ENABLED !== 'false',

    baseRate: readNumber(
        'MINING_BASE_RATE',
        DEFAULTS.BASE_RATE,
        { min: 0.000000000001, max: 1000000 }
    ),

    intervalMs: readNumber(
        'MINING_INTERVAL_MS',
        DEFAULTS.INTERVAL_MS,
        { min: 1000, max: 24 * 60 * 60 * 1000 }
    ),

    maxSessionMs: readNumber(
        'MINING_MAX_SESSION_MS',
        DEFAULTS.MAX_SESSION_MS,
        { min: 1000, max: 30 * 24 * 60 * 60 * 1000 }
    ),

    maxClaimAmount: readNumber(
        'MINING_MAX_CLAIM_AMOUNT',
        DEFAULTS.MAX_CLAIM_AMOUNT,
        { min: 0.000000000001, max: 1000000000 }
    ),

    decimalPlaces: readNumber(
        'MINING_DECIMAL_PLACES',
        DEFAULTS.DECIMAL_PLACES,
        { min: 0, max: 12 }
    ),

    maxActiveSessions: readNumber(
        'MINING_MAX_ACTIVE_SESSIONS',
        DEFAULTS.MAX_ACTIVE_SESSIONS,
        { min: 1, max: 100 }
    ),

    currency: 'SKD',

    getReward(elapsedMs, multiplier = 1) {
        if (
            !Number.isFinite(elapsedMs) ||
            elapsedMs < 0
        ) {
            throw new TypeError(
                'Elapsed time must be a non-negative number.'
            );
        }

        if (
            !Number.isFinite(multiplier) ||
            multiplier < 1 ||
            multiplier > 300
        ) {
            throw new TypeError(
                'Mining multiplier must be between 1 and 300.'
            );
        }

        const completedIntervals = Math.floor(
            elapsedMs / this.intervalMs
        );

        const reward =
            completedIntervals *
            this.baseRate *
            multiplier;

        return Number(
            reward.toFixed(this.decimalPlaces)
        );
    }
});

module.exports = MiningConfig;
