'use strict';

const TransferStatus = Object.freeze({
  CREATED: 'CREATED',
  VALIDATING: 'VALIDATING',
  PROCESSING: 'PROCESSING',
  PENDING: 'PENDING',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED',
  REQUIRES_RECONCILIATION: 'REQUIRES_RECONCILIATION'
});

const TERMINAL_STATUSES = new Set([
  TransferStatus.SUCCESSFUL,
  TransferStatus.FAILED,
  TransferStatus.REVERSED
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  [TransferStatus.CREATED]: [
    TransferStatus.VALIDATING,
    TransferStatus.FAILED
  ],

  [TransferStatus.VALIDATING]: [
    TransferStatus.PROCESSING,
    TransferStatus.FAILED
  ],

  [TransferStatus.PROCESSING]: [
    TransferStatus.PENDING,
    TransferStatus.SUCCESSFUL,
    TransferStatus.FAILED,
    TransferStatus.REQUIRES_RECONCILIATION
  ],

  [TransferStatus.PENDING]: [
    TransferStatus.SUCCESSFUL,
    TransferStatus.FAILED,
    TransferStatus.REQUIRES_RECONCILIATION
  ],

  [TransferStatus.REQUIRES_RECONCILIATION]: [
    TransferStatus.PENDING,
    TransferStatus.SUCCESSFUL,
    TransferStatus.FAILED,
    TransferStatus.REVERSED
  ],

  [TransferStatus.SUCCESSFUL]: [
    TransferStatus.REVERSED
  ],

  [TransferStatus.FAILED]: [],

  [TransferStatus.REVERSED]: []
});

function isValidStatus(status) {
  return Object.values(TransferStatus).includes(status);
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

function canTransition(currentStatus, nextStatus) {
  if (!isValidStatus(currentStatus) || !isValidStatus(nextStatus)) {
    return false;
  }

  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

function assertTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    const error = new Error(
      `Invalid transfer status transition: ${currentStatus} -> ${nextStatus}`
    );

    error.code = 'INVALID_TRANSFER_STATUS_TRANSITION';
    error.statusCode = 409;

    throw error;
  }
}

module.exports = {
  TransferStatus,
  TERMINAL_STATUSES,
  isValidStatus,
  isTerminalStatus,
  canTransition,
  assertTransition
};
