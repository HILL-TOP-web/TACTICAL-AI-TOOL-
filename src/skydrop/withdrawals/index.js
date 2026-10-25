'use strict';

require('dotenv').config();

// 1. Withdrawal configuration
const {
    WithdrawalConfig,
    validateWithdrawalConfig
} = require('./WithdrawalConfig');

// 2. Withdrawal limits
const WithdrawalLimits = require('./WithdrawalLimits');

// 3. Withdrawal request validation
const WithdrawalValidator = require('./WithdrawalValidator');

// 4. Withdrawal processing engine
const WithdrawalEngine = require('./WithdrawalEngine');

// 5. Withdrawal service
const WithdrawalService = require('./WithdrawalService');

// 6. Monnify withdrawal gateway
const MonnifyWithdrawalGateway =
    require('./MonnifyWithdrawalGateway');

// 7. Withdrawal statuses
const WithdrawalStatus = require('./WithdrawalStatus');

// 8. Withdrawal methods
const {
    WithdrawalMethod,
    WithdrawalMethodManager
} = require('./WithdrawalMethod');

// 9. Export all withdrawal modules
module.exports = {
    WithdrawalConfig,
    validateWithdrawalConfig,
    WithdrawalLimits,
    WithdrawalValidator,
    WithdrawalEngine,
    WithdrawalService,
    MonnifyWithdrawalGateway,
    WithdrawalStatus,
    WithdrawalMethod,
    WithdrawalMethodManager
};
