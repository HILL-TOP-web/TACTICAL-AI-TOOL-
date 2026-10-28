'use strict';

/*
|--------------------------------------------------------------------------
| SkyDrop Withdrawal Module
|--------------------------------------------------------------------------
| Central entry point for the withdrawal module.
|
| Connects:
| 1. WithdrawalEngine.js
| 2. WithdrawalService.js
| 3. WithdrawalValidator.js
| 4. WithdrawalLimits.js
| 5. WithdrawalConfig.js
| 6. WithdrawalMethod.js
| 7. WithdrawalStatus.js
| 8. MonnifyWithdrawalGateway.js
| 9. Withdrawal repository.js
| 10. WithdrawalController.js
| 11. WithdrawalRoutes.js
|--------------------------------------------------------------------------
*/

const WithdrawalEngine = require('./WithdrawalEngine');
const WithdrawalService = require('./WithdrawalService');
const WithdrawalValidator = require('./WithdrawalValidator');
const WithdrawalLimits = require('./WithdrawalLimits');
const WithdrawalConfig = require('./WithdrawalConfig');
const WithdrawalMethod = require('./WithdrawalMethod');
const WithdrawalStatus = require('./WithdrawalStatus');
const MonnifyWithdrawalGateway = require('./MonnifyWithdrawalGateway');
const WithdrawalRepository = require('./Withdrawal repository');
const WithdrawalController = require('./WithdrawalController');
const WithdrawalRoutes = require('./WithdrawalRoutes');

/*
|--------------------------------------------------------------------------
| Public exports
|--------------------------------------------------------------------------
| Other SkyDrop modules can import the withdrawal components through:
|
| const withdrawals = require('./skydrop/withdrawals');
|--------------------------------------------------------------------------
*/

module.exports = {
  WithdrawalEngine,
  WithdrawalService,
  WithdrawalValidator,
  WithdrawalLimits,
  WithdrawalConfig,
  WithdrawalMethod,
  WithdrawalStatus,
  MonnifyWithdrawalGateway,
  WithdrawalRepository,
  WithdrawalController,
  WithdrawalRoutes
};
