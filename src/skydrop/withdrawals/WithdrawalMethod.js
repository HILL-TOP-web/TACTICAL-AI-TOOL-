"use strict";

const WithdrawalMethods = Object.freeze({
  MONNIFY: "MONNIFY",
  BANK_TRANSFER: "BANK_TRANSFER"
});

function isSupportedMethod(method) {
  return Object.values(WithdrawalMethods).includes(
    String(method || "").trim().toUpperCase()
  );
}

function normalizeMethod(method) {
  const normalized = String(method || "")
    .trim()
    .toUpperCase();

  if (!isSupportedMethod(normalized)) {
    throw new Error("UNSUPPORTED_WITHDRAWAL_METHOD");
  }

  return normalized;
}

module.exports = {
  WithdrawalMethods,
  isSupportedMethod,
  normalizeMethod
};
