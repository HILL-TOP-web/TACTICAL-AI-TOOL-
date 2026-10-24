'use strict';

require('dotenv').config();

const MiningConfig = require('./MiningConfig');

function checkMiningConfig() {
    const errors = [];

    if (
        !Number.isFinite(MiningConfig.baseRate) ||
        MiningConfig.baseRate <= 0
    ) {
        errors.push('Mining base rate is invalid.');
    }

    if (
        !Number.isInteger(MiningConfig.intervalMs) ||
        MiningConfig.intervalMs < 1000
    ) {
        errors.push('Mining interval is invalid.');
    }

    if (
        !Number.isFinite(MiningConfig.maxClaimAmount) ||
        MiningConfig.maxClaimAmount <= 0
    ) {
        errors.push('Mining claim limit is invalid.');
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors
        };
    }

    return {
        valid: true,
        miningEnabled: MiningConfig.enabled,
        currency: MiningConfig.currency,
        intervalMs: MiningConfig.intervalMs
    };
}

module.exports = checkMiningConfig;
