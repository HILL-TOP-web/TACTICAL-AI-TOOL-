'use strict';

const {
  getWithdrawalConfig
} = require('./WithdrawalConfig');

function getWithdrawalMethods(env = process.env) {
  const config = getWithdrawalConfig(env);

  return [
    {
      id: 'monnify',
      label: 'Monnify',
      currency: 'NGN',

      enabled:
        config.enabled &&
        config.monnifyEnabled &&
        config.bankWithdrawalsEnabled
    }
  ];
}

module.exports = {
  getWithdrawalMethods
};
