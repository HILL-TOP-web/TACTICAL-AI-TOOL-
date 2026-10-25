"use strict";

const WithdrawalStatus = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REQUIRES_RECONCILIATION: "requires_reconciliation"
});

const TERMINAL_STATUSES = new Set([
  WithdrawalStatus.SUCCESSFUL,
  WithdrawalStatus.FAILED,
  WithdrawalStatus.CANCELLED
]);

function isValid(status) {
  return Object.values(WithdrawalStatus).includes(
    status
  );
}

function isTerminal(status) {
  return TERMINAL_STATUSES.has(status);
}

function canTransition(current, next) {
  const transitions = {
    [WithdrawalStatus.PENDING]: [
      WithdrawalStatus.PROCESSING,
      WithdrawalStatus.FAILED,
      WithdrawalStatus.CANCELLED,
      WithdrawalStatus.REQUIRES_RECONCILIATION
    ],

    [WithdrawalStatus.PROCESSING]: [
      WithdrawalStatus.SUCCESSFUL,
      WithdrawalStatus.FAILED,
      WithdrawalStatus.REQUIRES_RECONCILIATION
    ],

    [WithdrawalStatus.REQUIRES_RECONCILIATION]: [
      WithdrawalStatus.PROCESSING,
      WithdrawalStatus.SUCCESSFUL,
      WithdrawalStatus.FAILED
    ],

    [WithdrawalStatus.SUCCESSFUL]: [],
    [WithdrawalStatus.FAILED]: [],
    [WithdrawalStatus.CANCELLED]: []
  };

  return (
    isValid(current) &&
    isValid(next) &&
    transitions[current].includes(next)
  );
}

function assertTransition(current, next) {
  if (!canTransition(current, next)) {
    const error = new Error(
      `Invalid withdrawal status transition: ${current} -> ${next}.`
    );

    error.code = "INVALID_STATUS_TRANSITION";
    throw error;
  }

  return true;
}

module.exports = Object.freeze({
  ...WithdrawalStatus,
  isValid,
  isTerminal,
  canTransition,
  assertTransition
});
