'use strict';

/*
|--------------------------------------------------------------------------
| SkyDrop Transaction Module
|--------------------------------------------------------------------------
| Central entry point for transaction components.
|
| Existing files:
| 1. TransactionController.js
| 2. TransactionHistory.js
| 3. TransactionRoutes.js
| 4. TransactionService.js
| 5. TransactionStatus.js
| 6. TransactionValidator.js
| 7. transactionEngine.js
|
| The reconciliation filenames in the screenshot are truncated.
|--------------------------------------------------------------------------
*/

const TransactionController =
  require('./TransactionController');

const TransactionHistory =
  require('./TransactionHistory');

const TransactionRoutes =
  require('./TransactionRoutes');

const TransactionService =
  require('./TransactionService');

const TransactionStatus =
  require('./TransactionStatus');

const TransactionValidator =
  require('./TransactionValidator');

const transactionEngine =
  require('./transactionEngine');

/*
|--------------------------------------------------------------------------
| Public exports
|--------------------------------------------------------------------------
| Other SkyDrop modules can import these components through:
|
| const transactions = require('./skydrop/transactions');
|--------------------------------------------------------------------------
*/

module.exports = {
  TransactionController,
  TransactionHistory,
  TransactionRoutes,
  TransactionService,
  TransactionStatus,
  TransactionValidator,
  transactionEngine
};
