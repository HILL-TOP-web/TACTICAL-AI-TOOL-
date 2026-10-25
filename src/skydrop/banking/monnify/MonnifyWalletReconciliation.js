'use strict';

const {
  getTransferStatus
} = require('./MonnifyDisbursement');

const SUCCESS_STATUSES = new Set([
  'SUCCESS',
  'COMPLETED',
  'SUCCEEDED'
]);

const FAILURE_STATUSES = new Set([
  'FAILED',
  'EXPIRED'
]);

function normalizeProviderStatus(value) {
  const status = String(
    value || ''
  ).toUpperCase();

  if (SUCCESS_STATUSES.has(status)) {
    return 'SUCCEEDED';
  }

  if (status === 'REVERSED') {
    return 'REVERSED';
  }

  if (FAILURE_STATUSES.has(status)) {
    return 'FAILED';
  }

  if (status === 'PENDING_AUTHORIZATION') {
    return 'PENDING_AUTHORIZATION';
  }

  return 'PENDING';
}

async function reconcileReference(
  reference,
  repository
) {
  if (
    !repository ||
    typeof repository.findByProviderReference !== 'function' ||
    typeof repository.settleProviderStatus !== 'function'
  ) {
    throw new Error(
      'Persistent withdrawal repository is required for reconciliation.'
    );
  }

  if (
    typeof reference !== 'string' ||
    !reference.trim()
  ) {
    throw new Error(
      'A valid transfer reference is required.'
    );
  }

  const localWithdrawal =
    await repository.findByProviderReference(
      reference
    );

  if (!localWithdrawal) {
    throw new Error(
      'No local withdrawal matches this provider reference.'
    );
  }

  // Query Monnify for the current status.
  const provider = await getTransferStatus(
    reference
  );

  const providerStatus = String(
    provider.status || ''
  ).toUpperCase();

  const status = normalizeProviderStatus(
    providerStatus
  );

  // If the provider returns an amount, ensure it matches the
  // local withdrawal amount before applying a terminal status.
  if (provider.amount != null) {
    const providerAmount = Number(
      provider.amount
    );

    const localAmount = Number(
      localWithdrawal.amountNgn
    );

    if (
      !Number.isFinite(providerAmount) ||
      Math.round(providerAmount * 100) !==
        Math.round(localAmount * 100)
    ) {
      throw new Error(
        'Provider amount does not match local withdrawal. Reconciliation stopped.'
      );
    }
  }

  return repository.settleProviderStatus(
    localWithdrawal.id,
    status,
    {
      providerStatus,
      providerReference:
        provider.reference ||
        provider.transactionReference ||
        reference,
      checkedAt: new Date().toISOString()
    }
  );
}

async function reconcilePending(
  repository,
  limit = 50
) {
  if (
    !repository ||
    typeof repository.listReconciliationCandidates !== 'function'
  ) {
    throw new Error(
      'Repository must implement listReconciliationCandidates.'
    );
  }

  const rows = await repository.listReconciliationCandidates(
    limit
  );

  const results = [];

  for (const row of rows) {
    const reference =
      row.providerReference ||
      row.reference;

    try {
      const result = await reconcileReference(
        reference,
        repository
      );

      results.push({
        reference,
        result
      });
    } catch (error) {
      results.push({
        reference,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  reconcileReference,
  reconcilePending,
  normalizeProviderStatus
};
