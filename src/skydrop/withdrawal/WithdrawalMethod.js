"use strict";

const WithdrawalConfig = require("./WithdrawalConfig");

const WithdrawalMethod = Object.freeze({
  MONNIFY: "monnify",
  BANK: "bank"
});

function isSupported(method) {
  return Object.values(WithdrawalMethod).includes(
    String(method || "").toLowerCase()
  );
}

function isEnabled(method) {
  const normalized = String(method || "").toLowerCase();

  if (!WithdrawalConfig.enabled) {
    return false;
  }

  switch (normalized) {
    case WithdrawalMethod.MONNIFY:
      return (
        WithdrawalConfig.monnifyEnabled &&
        WithdrawalConfig.monnifyWithdrawalsEnabled
      );

    case WithdrawalMethod.BANK:
      return WithdrawalConfig.bankWithdrawalsEnabled;

    default:
      return false;
  }
}

function getAvailableMethods() {
  return Object.values(WithdrawalMethod).filter(isEnabled);
}

function assertEnabled(method) {
  if (!isSupported(method)) {
    const error = new Error(
      "Unsupported withdrawal method."
    );

    error.code = "UNSUPPORTED_WITHDRAWAL_METHOD";
    throw error;
  }

  if (!isEnabled(method)) {
    const error = new Error(
      "This withdrawal method is currently disabled."
    );

    error.code = "WITHDRAWAL_METHOD_DISABLED";
    throw error;
  }

  return String(method).toLowerCase();
}

module.exports = Object.freeze({
  ...WithdrawalMethod,
  isSupported,
  isEnabled,
  getAvailableMethods,
  assertEnabled
});
