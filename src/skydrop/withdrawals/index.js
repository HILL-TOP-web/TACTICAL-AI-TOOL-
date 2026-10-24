'use strict';

const WithdrawalEngine = require('./WithdrawalEngine');
const WithdrawalValidator = require('./WithdrawalValidator');

const WithdrawalStatusModule = require('./WithdrawalStatus');
const WithdrawalLimitsModule = require('./WithdrawalLimits');
const WithdrawalMethodsModule = require('./WithdrawalMethods');

const WithdrawalService = require('./WithdrawalService');
const MonnifyWithdrawalGateway = require('./MonnifyWithdrawalGateway');

module.exports = {
    WithdrawalEngine,
    WithdrawalValidator,

    WithdrawalStatus: WithdrawalStatusModule,
    WithdrawalStatusManager:
        WithdrawalStatusModule.WithdrawalStatusManager,

    WithdrawalLimits: WithdrawalLimitsModule,
    WithdrawalLimitsManager:
        WithdrawalLimitsModule.WithdrawalLimitsManager,

    WithdrawalMethods: WithdrawalMethodsModule,
    WithdrawalMethodsManager:
        WithdrawalMethodsModule.WithdrawalMethodsManager,

    WithdrawalService,
    MonnifyWithdrawalGateway
};
