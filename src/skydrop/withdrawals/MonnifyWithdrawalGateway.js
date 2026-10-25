'use strict';

const {
  initiateSingleTransfer,
  authorizeSingleTransfer
} = require('../../finance/banking/monnify/MonnifyDisbursement');

const {
  assertWithdrawalEnabled
} = require('./WithdrawalConfig');

class MonnifyWithdrawalGateway {
  async send(withdrawal) {
    assertWithdrawalEnabled();

    const response = await initiateSingleTransfer({
      amountNgn: withdrawal.amountNgn,

      reference:
        withdrawal.providerReference ||
        withdrawal.reference,

      destinationBankCode:
        withdrawal.destinationBankCode,

      destinationAccountNumber:
        withdrawal.destinationAccountNumber,

      destinationAccountName:
        withdrawal.destinationAccountName,

      narration:
        `SkyDrop withdrawal ${withdrawal.reference}`
    });

    const providerStatus = String(
      response.status || 'PENDING'
    ).toUpperCase();

    return {
      providerReference:
        response.reference ||
        withdrawal.providerReference ||
        withdrawal.reference,

      providerStatus,
      rawStatus: providerStatus
    };
  }

  async authorize(
    reference,
    authorizationCode
  ) {
    assertWithdrawalEnabled();

    const response = await authorizeSingleTransfer(
      reference,
      authorizationCode
    );

    const providerStatus = String(
      response.status || 'PENDING'
    ).toUpperCase();

    return {
      providerReference:
        response.reference || reference,

      providerStatus,
      rawStatus: providerStatus
    };
  }
}

module.exports = {
  MonnifyWithdrawalGateway
};
