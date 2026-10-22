'use strict';

const TransactionStatusModule = require('./TransactionStatus');

const TransactionValidator = require('./TransactionValidator');

const TransactionReference = require('./TransactionReference');

const TransactionManager = require('./TransactionManager');

const TransactionHistory = require('./TransactionHistory');

const TransactionReconciliation =
    require('./TransactionReconciliation');

module.exports = {
    // Status constants and transition rules.
    TransactionStatus:
        TransactionStatusModule.TransactionStatus,

    TERMINAL_STATUSES:
        TransactionStatusModule.TERMINAL_STATUSES,

    ALLOWED_TRANSITIONS:
        TransactionStatusModule.ALLOWED_TRANSITIONS,

    isValidStatus:
        TransactionStatusModule.isValidStatus,

    canTransition:
        TransactionStatusModule.canTransition,

    assertValidStatus:
        TransactionStatusModule.assertValidStatus,

    assertTransition:
        TransactionStatusModule.assertTransition,

    isTerminalStatus:
        TransactionStatusModule.isTerminalStatus,

    // Validation.
    TransactionValidator,

    // Reference generation.
    TransactionReference,

    // Main transaction services.
    TransactionManager,

    TransactionHistory,

    TransactionReconciliation
};
