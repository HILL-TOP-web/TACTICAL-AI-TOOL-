'use strict';

const {
  getWithdrawalConfig
} = require('./WithdrawalConfig');

function getWithdrawalLimits(env = process.env) {
  const config = getWithdrawalConfig(env);

  if (
    !Number.isSafeInteger(config.minimumNgn) ||
    config.minimumNgn < 100
  ) {
    throw new Error(
      'SKYDROP_MIN_WITHDRAWAL_NGN must be a valid whole amount of at least 100 NGN.'
    );
  }

  return Object.freeze({
    minimumNgn: config.minimumNgn
  });
}

module.exports = {
  getWithdrawalLimits
};
