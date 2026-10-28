'use strict';

const mongoose = require('mongoose');

const TRANSACTION_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PENDING_AUTHORIZATION: 'PENDING_AUTHORIZATION',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED',
  EXPIRED: 'EXPIRED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
});

const TERMINAL_STATUSES = new Set([
  TRANSACTION_STATUSES.SUCCESS,
  TRANSACTION_STATUSES.FAILED,
  TRANSACTION_STATUSES.REVERSED,
  TRANSACTION_STATUSES.EXPIRED,
]);

const transactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    provider: {
      type: String,
      required: true,
      enum: ['MONNIFY'],
      default: 'MONNIFY',
      immutable: true,
    },

    providerReference: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    providerTransactionReference: {
      type: String,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['NGN'],
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(TRANSACTION_STATUSES),
      default: TRANSACTION_STATUSES.PENDING,
      index: true,
    },

    providerStatus: {
      type: String,
      default: null,
    },

    transactionType: {
      type: String,
      required: true,
      enum: ['WITHDRAWAL', 'TRANSFER'],
    },

    reconciliation: {
      attempts: {
        type: Number,
        default: 0,
      },

      nextAttemptAt: {
        type: Date,
        default: Date.now,
      },

      lastAttemptAt: {
        type: Date,
        default: null,
      },

      lastSuccessfulCheckAt: {
        type: Date,
        default: null,
      },

      lastErrorCode: {
        type: String,
        default: null,
      },

      lastErrorAt: {
        type: Date,
        default: null,
      },

      leaseId: {
        type: String,
        default: null,
      },

      leaseExpiresAt: {
        type: Date,
        default: null,
      },

      lastProviderDescription: {
        type: String,
        default: null,
      },
    },

    completedAt: {
      type: Date,
      default: null,
    },

    providerCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: '__v',
    strict: 'throw',
    collection: 'skydrop_transactions',
  }
);

transactionSchema.index(
  { reference: 1 },
  { unique: true }
);

transactionSchema.index(
  { provider: 1, providerReference: 1 },
  { unique: true }
);

transactionSchema.index({
  status: 1,
  'reconciliation.nextAttemptAt': 1,
  'reconciliation.leaseExpiresAt': 1,
});

const TransactionRecord =
  mongoose.models.SkyDropReconciliationTransaction ||
  mongoose.model(
    'SkyDropReconciliationTransaction',
    transactionSchema
  );

function decimalToNumber(value) {
  if (value === undefined || value === null) {
    return NaN;
  }

  return Number(
    typeof value.toString === 'function'
      ? value.toString()
      : value
  );
}

class TransactionReconciliationRepository {
  constructor(options = {}) {
    this.model = options.model || TransactionRecord;
  }

  async claimNextBatch({
    batchSize,
    staleBefore,
    now,
    leaseId,
    leaseUntil,
  }) {
    const results = [];

    for (let i = 0; i < batchSize; i += 1) {
      const record = await this.model.findOneAndUpdate(
        {
          status: {
            $in: [
              TRANSACTION_STATUSES.PENDING,
              TRANSACTION_STATUSES.PROCESSING,
              TRANSACTION_STATUSES.PENDING_AUTHORIZATION,
            ],
          },

          'reconciliation.attempts': { $lt: 1000000 },

          $and: [
            {
              $or: [
                {
                  'reconciliation.nextAttemptAt': {
                    $lte: now,
                  },
                },
                {
                  'reconciliation.nextAttemptAt': null,
                },
              ],
            },
            {
              $or: [
                {
                  'reconciliation.leaseExpiresAt': {
                    $lte: now,
                  },
                },
                {
                  'reconciliation.leaseExpiresAt': null,
                },
                {
                  'reconciliation.leaseId': null,
                },
              ],
            },
            {
              $or: [
                { providerCheckedAt: null },
                { providerCheckedAt: { $lte: staleBefore } },
              ],
            },
          ],
        },
        {
          $set: {
            'reconciliation.leaseId': leaseId,
            'reconciliation.leaseExpiresAt': leaseUntil,
            'reconciliation.lastAttemptAt': now,
          },
          $inc: {
            'reconciliation.attempts': 1,
          },
        },
        {
          new: true,
          sort: { createdAt: 1 },
        }
      ).lean();

      if (!record) {
        break;
      }

      results.push(record);
    }

    return results;
  }

  async releaseLease(reference, leaseId) {
    await this.model.updateOne(
      {
        reference,
        'reconciliation.leaseId': leaseId,
      },
      {
        $set: {
          'reconciliation.leaseId': null,
          'reconciliation.leaseExpiresAt': null,
        },
      }
    );
  }

  async recordError({
    reference,
    leaseId,
    code,
    nextAttemptAt,
    now,
  }) {
    return this.model.updateOne(
      {
        reference,
        'reconciliation.leaseId': leaseId,
        status: { $nin: [...TERMINAL_STATUSES] },
      },
      {
        $set: {
          'reconciliation.lastErrorCode': code,
          'reconciliation.lastErrorAt': now,
          'reconciliation.nextAttemptAt': nextAttemptAt,
          'reconciliation.leaseId': null,
          'reconciliation.leaseExpiresAt': null,
        },
      }
    );
  }

  async applyProviderResult({
    record,
    leaseId,
    providerResult,
    now,
  }) {
    const storedAmount = decimalToNumber(record.amount);

    if (
      !Number.isFinite(storedAmount) ||
      Math.abs(storedAmount - providerResult.amount) > 0.000001
    ) {
      return this.model.updateOne(
        {
          _id: record._id,
          'reconciliation.leaseId': leaseId,
          status: { $nin: [...TERMINAL_STATUSES] },
        },
        {
          $set: {
            status: TRANSACTION_STATUSES.MANUAL_REVIEW,
            providerStatus: providerResult.status,
            providerCheckedAt: now,
            'reconciliation.lastSuccessfulCheckAt': now,
            'reconciliation.lastErrorCode': 'AMOUNT_MISMATCH',
            'reconciliation.lastErrorAt': now,
            'reconciliation.leaseId': null,
            'reconciliation.leaseExpiresAt': null,
          },
        }
      );
    }

    if (
      String(record.currency).toUpperCase() !==
      providerResult.currency
    ) {
      return this.model.updateOne(
        {
          _id: record._id,
          'reconciliation.leaseId': leaseId,
          status: { $nin: [...TERMINAL_STATUSES] },
        },
        {
          $set: {
            status: TRANSACTION_STATUSES.MANUAL_REVIEW,
            providerStatus: providerResult.status,
            providerCheckedAt: now,
            'reconciliation.lastSuccessfulCheckAt': now,
            'reconciliation.lastErrorCode': 'CURRENCY_MISMATCH',
            'reconciliation.lastErrorAt': now,
            'reconciliation.leaseId': null,
            'reconciliation.leaseExpiresAt': null,
          },
        }
      );
    }

    const statusMap = {
      SUCCESS: TRANSACTION_STATUSES.SUCCESS,
      COMPLETED: TRANSACTION_STATUSES.SUCCESS,
      FAILED: TRANSACTION_STATUSES.FAILED,
      REVERSED: TRANSACTION_STATUSES.REVERSED,
      EXPIRED: TRANSACTION_STATUSES.EXPIRED,

      PENDING: TRANSACTION_STATUSES.PENDING,
      IN_PROGRESS: TRANSACTION_STATUSES.PROCESSING,
      AWAITING_PROCESSING: TRANSACTION_STATUSES.PROCESSING,
      PENDING_AUTHORIZATION:
        TRANSACTION_STATUSES.PENDING_AUTHORIZATION,
      PENDING_BATCH_AUTHORIZATION:
        TRANSACTION_STATUSES.PENDING_AUTHORIZATION,
      OTP_EMAIL_DISPATCH_FAILED:
        TRANSACTION_STATUSES.PENDING_AUTHORIZATION,
    };

    const nextStatus = statusMap[providerResult.status];

    if (!nextStatus) {
      throw new Error('Unsupported provider transaction status.');
    }

    // Do not let a delayed response overwrite a terminal status.
    const filter = {
      _id: record._id,
      'reconciliation.leaseId': leaseId,
      status: { $nin: [...TERMINAL_STATUSES] },
    };

    const update = {
      $set: {
        status: nextStatus,
        providerStatus: providerResult.status,
        providerCheckedAt: now,
        'reconciliation.lastSuccessfulCheckAt': now,
        'reconciliation.lastProviderDescription':
          providerResult.description,
        'reconciliation.lastErrorCode': null,
        'reconciliation.lastErrorAt': null,
        'reconciliation.leaseId': null,
        'reconciliation.leaseExpiresAt': null,
        'reconciliation.nextAttemptAt': now,
      },
    };

    if (providerResult.transactionReference) {
      update.$set.providerTransactionReference =
        providerResult.transactionReference;
    }

    if (TERMINAL_STATUSES.has(nextStatus)) {
      update.$set.completedAt = now;
    }

    return this.model.updateOne(filter, update);
  }
}

module.exports = {
  TransactionRecord,
  TransactionReconciliationRepository,
  TRANSACTION_STATUSES,
  TERMINAL_STATUSES,
};
