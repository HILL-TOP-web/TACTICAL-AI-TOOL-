// 5. src/finance/banking/monnify/index.js

"use strict";

const MonnifyFunding =
  require("./MonnifyFunding");

const MonnifyWallet =
  require("./MonnifyWallet");

const MonnifyWalletWebhook =
  require("./MonnifyWalletWebhook");

const MonnifyWalletReconciliation =
  require("./MonnifyWalletReconciliation");

function createMonnifyServices(options = {}) {
  const funding =
    options.funding ||
    new MonnifyFunding(options);

  const wallet =
    options.wallet ||
    new MonnifyWallet({
      ...options,
      client: funding
    });

  const webhook =
    options.webhook ||
    new MonnifyWalletWebhook({
      ...options,
      client: funding
    });

  const reconciliation =
    options.reconciliation ||
    new MonnifyWalletReconciliation({
      ...options,
      wallet
    });

  return {
    funding,
    wallet,
    webhook,
    reconciliation
  };
}

module.exports = {
  MonnifyFunding,
  MonnifyWallet,
  MonnifyWalletWebhook,
  MonnifyWalletReconciliation,
  createMonnifyServices
};
