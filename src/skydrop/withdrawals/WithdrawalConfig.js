'use strict';

function readBoolean(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  return String(value).toLowerCase() === 'true';
}

function getWithdrawalConfig(env = process.env) {
  return Object.freeze({
    enabled: readBoolean(
      env.SKYDROP_WITHDRAWALS_ENABLED
    ),

    monnifyEnabled: readBoolean(
      env.SKYDROP_MONNIFY_WITHDRAWALS_ENABLED,
      readBoolean(env.MONNIFY_ENABLED)
    ),

    bankWithdrawalsEnabled: readBoolean(
      env.SKYDROP_BANK_WITHDRAWALS_ENABLED,
      true
    ),

    minimumNgn: Number(
      env.SKYDROP_MIN_WITHDRAWAL_NGN || 100
    ),

    provider: 'monnify',

    currency: 'NGN'
  });
}

module.exports = {
  getWithdrawalConfig
};
