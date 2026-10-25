"use strict";

const { getEnvBoolean, getEnvNumber } = require("../../config/env");

const WithdrawalConfig = Object.freeze({
  enabled: getEnvBoolean("SKYDROP_WITHDRAWALS_ENABLED", false),

  minimumWithdrawalNGN: getEnvNumber(
    "SKYDROP_MIN_WITHDRAWAL_NGN",
    100
  ),

  maximumWithdrawalNGN: getEnvNumber(
    "SKYDROP_MAX_WITHDRAWAL_NGN",
    100000
  ),

  currency: "NGN",

  requestTimeoutMs: getEnvNumber(
    "MONNIFY_REQUEST_TIMEOUT_MS",
    15000
  ),

  monnifyEnabled: getEnvBoolean(
    "MONNIFY_ENABLED",
    false
  ),

  bankWithdrawalsEnabled: getEnvBoolean(
    "SKYDROP_BANK_WITHDRAWALS_ENABLED",
    false
  ),

  monnifyWithdrawalsEnabled: getEnvBoolean(
    "SKYDROP_MONNIFY_WITHDRAWALS_ENABLED",
    false
  )
});

if (
  !Number.isFinite(WithdrawalConfig.minimumWithdrawalNGN) ||
  WithdrawalConfig.minimumWithdrawalNGN < 100
) {
  throw new Error(
    "SKYDROP_MIN_WITHDRAWAL_NGN must be at least 100."
  );
}

if (
  !Number.isFinite(WithdrawalConfig.maximumWithdrawalNGN) ||
  WithdrawalConfig.maximumWithdrawalNGN <
    WithdrawalConfig.minimumWithdrawalNGN
) {
  throw new Error(
    "SKYDROP_MAX_WITHDRAWAL_NGN must be greater than or equal to the minimum."
  );
}

if (
  !Number.isFinite(WithdrawalConfig.requestTimeoutMs) ||
  WithdrawalConfig.requestTimeoutMs < 1000
) {
  throw new Error(
    "MONNIFY_REQUEST_TIMEOUT_MS must be at least 1000."
  );
}

module.exports = WithdrawalConfig;
