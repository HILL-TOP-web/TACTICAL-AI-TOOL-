'use strict';

const crypto = require('node:crypto');

const {
  TransactionReconciliationRepository,
  TRANSACTION_STATUSES,
  TERMINAL_STATUSES,
} = require('./TransactionReconciliationRepository');

const {
  loadTransactionReconciliationConfig,
} = require('./TransactionReconciliationConfig');

const {
  MonnifyReconciliationClient,
} = require('../../finance/banking/monnify/MonnifyReconciliationClient');

class TransactionReconciliation {
  constructor(options = {}) {
    this.config =
      options.config ||
      loadTransactionReconciliationConfig(options.env || process.env);

    this.repository =
      options.repository ||
      new TransactionReconciliationRepository();

    this.provider =
      options.provider ||
      new MonnifyReconciliationClient({
        env: options.env || process.env,
        fetch: options.fetch,
        timeoutMs: this.config.requestTimeoutMs,
      });

    this.clock = options.clock || Date.now;
    this.logger = options.logger || console;

    this.running = false;
    this.timer = null;
    this.stopping = false;
  }

  log(level, message, metadata = {}) {
    const safeMetadata = {
      ...metadata,
    };

    // Never log credentials, tokens, or full bank-account details.
    delete safeMetadata.secretKey;
    delete safeMetadata.apiKey;
    delete safeMetadata.accessToken;
    delete safeMetadata.accountNumber;

    const method = this.logger[level];

    if (typeof method === 'function') {
      method.call(this.logger, message, safeMetadata);
    }
  }

  async reconcileBatch() {
    if (!this.config.enabled) {
      return {
        enabled: false,
        claimed: 0,
        processed: 0,
      };
    }

    if (this.running) {
      return {
        enabled: true,
        skipped: true,
        reason: 'RECONCILIATION_ALREADY_RUNNING',
      };
    }

    this.running = true;

    const now = new Date(this.clock());

    const leaseId = crypto.randomUUID();

    const leaseUntil = new Date(
      now.getTime() +
      this.config.requestTimeoutMs * 2 +
      5000
    );

    const staleBefore = new Date(
      now.getTime() -
      this.config.staleAfterMinutes * 60 * 1000
    );

    let claimed = [];

    try {
      claimed = await this.repository.claimNextBatch({
        batchSize: this.config.batchSize,
        staleBefore,
        now,
        leaseId,
        leaseUntil,
      });

      let processed = 0;

      for (const record of claimed) {
        if (this.stopping) {
          await this.repository.releaseLease(
            record.reference,
            leaseId
          );
          continue;
        }

        try {
          await this.reconcileOne(record, leaseId);
          processed += 1;
        } catch (error) {
          this.log('error', 'Transaction reconciliation failed.', {
            reference: record.reference,
            code: error.code || 'RECONCILIATION_ERROR',
          });
        }
      }

      return {
        enabled: true,
        claimed: claimed.length,
        processed,
      };
    } finally {
      this.running = false;
    }
  }

  async reconcileOne(record, leaseId) {
    if (!record || !record.reference || !record.providerReference) {
      throw new Error(
        'Transaction is missing its internal or provider reference.'
      );
    }

    if (record.provider !== 'MONNIFY') {
      throw new Error(
        'This reconciler only supports Monnify transactions.'
      );
    }

    if (TERMINAL_STATUSES.has(record.status)) {
      await this.repository.releaseLease(record.reference, leaseId);
      return {
        skipped: true,
        reason: 'TRANSACTION_ALREADY_TERMINAL',
      };
    }

    const providerResult = await this.provider.getDisbursementStatus(
      record.providerReference
    );

    if (providerResult.reference !== record.providerReference) {
      throw new Error(
        'The provider reference does not match the transaction record.'
      );
    }

    const result = await this.repository.applyProviderResult({
      record,
      leaseId,
      providerResult,
      now: new Date(this.clock()),
    });

    if (result.modifiedCount === 0) {
      this.log(
        'warn',
        'Transaction record was not updated; it may have changed concurrently.',
        {
          reference: record.reference,
        }
      );
    }

    return {
      reference: record.reference,
      providerStatus: providerResult.status,
      updated: result.modifiedCount === 1,
    };
  }

  start() {
    if (!this.config.enabled) {
      this.log(
        'info',
        'Transaction reconciliation is disabled.'
      );

      return false;
    }

    if (this.timer) {
      return false;
    }

    this.stopping = false;

    // Run immediately, then continue at the configured interval.
    void this.reconcileBatch().catch((error) => {
      this.log('error', 'Initial reconciliation run failed.', {
        code: error.code || 'RECONCILIATION_ERROR',
      });
    });

    this.timer = setInterval(() => {
      void this.reconcileBatch().catch((error) => {
        this.log('error', 'Scheduled reconciliation run failed.', {
          code: error.code || 'RECONCILIATION_ERROR',
        });
      });
    }, this.config.intervalMs);

    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }

    this.log('info', 'Transaction reconciliation started.', {
      intervalMs: this.config.intervalMs,
      batchSize: this.config.batchSize,
    });

    return true;
  }

  async stop() {
    this.stopping = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    while (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.log('info', 'Transaction reconciliation stopped.');
  }
}

module.exports = {
  TransactionReconciliation,
};
