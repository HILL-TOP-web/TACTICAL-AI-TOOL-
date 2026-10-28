'use strict';

const {
  getMonnifyAccessToken
} = require('../../finance/banking/monnify/MonnifyAuth');

const {
  submitDisbursement
} = require('../../finance/banking/monnify/MonnifyDisbursement');

class MonnifyWithdrawalGateway {
  async initiate(withdrawal) {
    const token = await getMonnifyAccessToken();

    return submitDisbursement({
      token,

      amount: withdrawal.amountNgn,

      reference: withdrawal.providerReference,

      destinationAccountNumber:
        withdrawal.recipientAccountNumber,

      destinationBankCode:
        withdrawal.bankCode,

      destinationAccountName:
        withdrawal.recipientAccountName,

      narration:
        withdrawal.narration || 'SkyDrop withdrawal'
    });
  }
}

module.exports = {
  MonnifyWithdrawalGateway
};
