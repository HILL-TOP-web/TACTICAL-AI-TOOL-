"use strict";

const {
  getMonnifyConfig,
  assertMonnifyEnabled,
  checkMonnifyConnectivity
} = require("../../finance/banking/monnify/MonnifyConfig");

const {
  MonnifyDisbursement
} = require("../../finance/banking/monnify/MonnifyDisbursement");

const {
  MonnifyWalletReconciliation
} = require("../../finance/banking/monnify/MonnifyWalletReconciliation");

class MonnifyWithdrawalGateway {
  constructor({
    disbursement = new MonnifyDisbursement(),
    reconciliation = new MonnifyWalletReconciliation(),
    configProvider = getMonnifyConfig,
    connectivityCheck = checkMonnifyConnectivity
  } = {}) {
    this.disbursement = disbursement;
    this.reconciliation = reconciliation;
    this.configProvider = configProvider;
    this.connectivityCheck = connectivityCheck;
  }

  async checkConnection() {
    const config = this.configProvider();

    assertMonnifyEnabled(config);

    return this.connectivityCheck();
  }

  async initiateWithdrawal({
    reference,
    amountNGN,
    destinationAccountNumber,
    destinationBankCode,
    destinationAccountName,
    narration
  }) {
    const config = this.configProvider();

    assertMonnifyEnabled(config);

    if (!Number.isSafeInteger(amountNGN) || amountNGN < 100) {
      throw new Error("INVALID_WITHDRAWAL_AMOUNT");
    }

    if (!reference) {
      throw new Error("WITHDRAWAL_REFERENCE_REQUIRED");
    }

    const result = await this.disbursement.initiate({
      amount: amountNGN,
      reference,
      destinationAccountNumber,
      destinationBankCode,
      destinationAccountName,
      narration
    });

    return {
      reference,
      providerReference:
        result.providerReference || reference,

      providerStatus:
        result.providerStatus || "PENDING",

      accepted: result.accepted === true,

      // Never treat request acceptance as final settlement.
      completed: false
    };
  }

  async reconcileWithdrawal({
    reference,
    transactionRepository
  }) {
    if (!reference) {
      throw new Error("WITHDRAWAL_REFERENCE_REQUIRED");
    }

    return this.reconciliation.reconcile({
      reference,
      transactionRepository
    });
  }
}

module.exports = {
  MonnifyWithdrawalGateway
};
