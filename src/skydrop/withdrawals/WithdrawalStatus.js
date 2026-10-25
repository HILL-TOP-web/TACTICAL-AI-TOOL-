"use strict";

const WithdrawalStatus = Object.freeze({
  REQUESTED: "REQUESTED",
  PROCESSING: "PROCESSING",
  PENDING: "PENDING",
  PENDING_RECONCILIATION: "PENDING_RECONCILIATION",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REVERSED: "REVERSED"
});

const FINAL_STATUSES = new Set([
  WithdrawalStatus.SUCCESS,
  WithdrawalStatus.FAILED,
  WithdrawalStatus.CANCELLED,
  WithdrawalStatus.REVERSED
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  REQUESTED: [
    "PROCESSING",
    "FAILED",
    "CANCELLED"
  ],

  PROCESSING: [
    "PENDING",
    "PENDING_RECONCILIATION",
    "SUCCESS",
    "FAILED"
  ],

  PENDING: [
    "PENDING_RECONCILIATION",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "REVERSED"
  ],

  PENDING_RECONCILIATION: [
    "PENDING",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "REVERSED"
  ],

  SUCCESS: [],
  FAILED: [],
  CANCELLED: [],
  REVERSED: []
});

function canTransition(currentStatus, nextStatus) {
  if (
    !Object.prototype.hasOwnProperty.call(
      ALLOWED_TRANSITIONS,
      currentStatus
    )
  ) {
    return false;
  }

  return ALLOWED_TRANSITIONS[currentStatus].includes(
    nextStatus
  );
}

function isFinalStatus(status) {
  return FINAL_STATUSES.has(status);
}

function assertTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    throw new Error("INVALID_WITHDRAWAL_STATUS_TRANSITION");
  }
}

module.exports = {
  WithdrawalStatus,
  FINAL_STATUSES,
  ALLOWED_TRANSITIONS,
  canTransition,
  isFinalStatus,
  assertTransition
};
