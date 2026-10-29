'use strict';

const {
    submitDisbursement,
    getDisbursementStatus
} = require('./MonnifyDisbursement');

async function initiateWithdrawal(withdrawal) {
    const response = await submitDisbursement({
        amount: withdrawal.amountNgn,

        reference: withdrawal.reference,

        narration:
            withdrawal.narration ||
            'SkyDrop withdrawal',

        destinationBankCode:
            withdrawal.bankCode,

        destinationAccountNumber:
            withdrawal.accountNumber,

        destinationAccountName:
            withdrawal.accountName
    });

    return {
        provider: 'monnify',

        reference: withdrawal.reference,

        providerReference:
            response.transactionReference ||
            response.reference ||
            null,

        providerStatus:
            response.status || 'PENDING',

        accepted: true
    };
}

async function reconcileWithdrawal(reference) {
    const response = await getDisbursementStatus(reference);

    return {
        provider: 'monnify',

        reference,

        providerReference:
            response.transactionReference ||
            response.reference ||
            null,

        providerStatus:
            response.status || 'UNKNOWN',

        rawStatus: response.status || 'UNKNOWN'
    };
}

module.exports = {
    initiateWithdrawal,
    reconcileWithdrawal
};
