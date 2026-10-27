'use strict';

const STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed'
});

const TRANSITIONS = Object.freeze({
  pending: [
    'processing',
    'successful',
    'failed',
    'cancelled'
  ],

  processing: [
    'successful',
    'failed'
  ],

  successful: [
    'reversed'
  ],

  failed: [],
  cancelled: [],
  reversed: []
});

function isValid(status) {
  return Object.values(STATUS).includes(status);
}

function canTransition(currentStatus, nextStatus) {
  return Array.isArray(TRANSITIONS[currentStatus]) &&
    TRANSITIONS[currentStatus].includes(nextStatus);
}

function assertTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid transaction status transition: ${currentStatus} -> ${nextStatus}`
    );
  }
}

module.exports = Object.freeze({
  ...STATUS,
  isValid,
  canTransition,
  assertTransition
});
