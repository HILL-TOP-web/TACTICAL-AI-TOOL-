'use strict';

/**
 * SkyDrop Monnify Integration
 *
 * Central entry point for the Monnify banking module.
 *
 * Exports:
 * 1. Monnify configuration and environment validation
 * 2. Authentication and access-token management
 * 3. Funding transaction verification
 * 4. Disbursement wallet balance
 * 5. Disbursement submission and status checking
 * 6. Webhook signature verification and handler creation
 * 7. Disbursement reconciliation
 */

const MonnifyConfig = require('./MonnifyConfig');
const MonnifyAuth = require('./MonnifyAuth');
const MonnifyFunding = require('./MonnifyFunding');
const MonnifyWallet = require('./MonnifyWallet');
const MonnifyDisbursement = require('./MonnifyDisbursement');
const MonnifyWalletWebhook = require('./MonnifyWalletWebhook');
const MonnifyWalletReconciliation = require(
    './MonnifyWalletReconciliation'
);

module.exports = {
    // Configuration
    ...MonnifyConfig,

    // Authentication
    ...MonnifyAuth,

    // Funding verification
    ...MonnifyFunding,

    // Monnify disbursement wallet
    ...MonnifyWallet,

    // Transfers and withdrawals
    ...MonnifyDisbursement,

    // Webhook handling
    ...MonnifyWalletWebhook,

    // Reconciliation
    ...MonnifyWalletReconciliation
};
