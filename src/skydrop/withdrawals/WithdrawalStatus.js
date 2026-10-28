'use strict';

const TERMINAL = new Set([
  'SUCCESS',
  'FAILED',
  'REVERSED'
]);

const TRANSITIONS = {
  PENDING: new Set([
    'PROCESSING',
    'FAILED',
    'UNKNOWN'
  ]),

  PROCESSING: new Set([
    'SUCCESS',
    'FAILED',
    'REVERSED',
    'UNKNOWN'
  ]),

  UNKNOWN: new Set([
    'PROCESSING',
    'SUCCESS',
    'FAILED',
    'REVERSED'
  ]),

  SUCCESS: new Set([
    'REVERSED'
  ]),

  FAILED: new Set(),

  REVERSED: new Set()
};

function canTransition(from, to) {
  if (from === to) {
    return true;
  }

  return Boolean(
    TRANSITIONS[from] &&
    TRANSITIONS[from].has(to)
  );
}

function isTerminal(status) {
  return TERMINAL.has(status);
}

module.exports = {
  canTransition,
  isTerminal,
  TERMINAL_WITHDRAWAL_STATUSES: [...TERMINAL]
};
