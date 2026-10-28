'use strict';

const DEFAULTS = Object.freeze({
  batchSize: 50,
  requestTimeoutMs: 15000,
  staleAfterMinutes: 5,
  maxAttempts: 10,
  retryDelayMs: 30000,
  intervalMs: 60000,
});

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid transaction reconciliation setting: ${name}`);
  }

  return parsed;
}

function loadTransactionReconciliationConfig(env = process.env) {
  const enabled = String(
    env.SKYDROP_TRANSACTION_RECONCILIATION_ENABLED ?? 'false'
  ).toLowerCase() === 'true';

  return Object.freeze({
    enabled,

    batchSize: positiveInteger(
      env.SKYDROP_RECONCILIATION_BATCH_SIZE,
      DEFAULTS.batchSize,
      'SKYDROP_RECONCILIATION_BATCH_SIZE'
    ),

    requestTimeoutMs: positiveInteger(
      env.SKYDROP_RECONCILIATION_TIMEOUT_MS,
      DEFAULTS.requestTimeoutMs,
      'SKYDROP_RECONCILIATION_TIMEOUT_MS'
    ),

    staleAfterMinutes: positiveInteger(
      env.SKYDROP_RECONCILIATION_STALE_MINUTES,
      DEFAULTS.staleAfterMinutes,
      'SKYDROP_RECONCILIATION_STALE_MINUTES'
    ),

    maxAttempts: positiveInteger(
      env.SKYDROP_RECONCILIATION_MAX_ATTEMPTS,
      DEFAULTS.maxAttempts,
      'SKYDROP_RECONCILIATION_MAX_ATTEMPTS'
    ),

    retryDelayMs: positiveInteger(
      env.SKYDROP_RECONCILIATION_RETRY_DELAY_MS,
      DEFAULTS.retryDelayMs,
      'SKYDROP_RECONCILIATION_RETRY_DELAY_MS'
    ),

    intervalMs: positiveInteger(
      env.SKYDROP_RECONCILIATION_INTERVAL_MS,
      DEFAULTS.intervalMs,
      'SKYDROP_RECONCILIATION_INTERVAL_MS'
    ),
  });
}

module.exports = {
  loadTransactionReconciliationConfig,
};
