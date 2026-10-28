'use strict';

const mongoose = require('mongoose');

const {
  TransferStatus,
  assertTransition
} = require('./TransferStatus');

const transferSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    reference: {
      type: String,
      required: true,
      unique: true
    },

    idempotencyKey: {
      type: String,
      required: true
    },

    requestHash: {
      type: String,
      required: true
    },

    amountKobo: {
      type: Number,
      required: true,
      min: 1
    },

    currency: {
      type: String,
      required: true,
      enum: ['NGN']
    },

    destinationAccountNumber: {
      type: String,
      required: true,
      select: false
    },

    destinationBankCode: {
      type: String,
      required: true
    },

    destinationAccountName: {
      type: String,
      default: null
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(TransferStatus),
      default: TransferStatus.CREATED,
      index: true
    },

    provider: {
      type: String,
      default: null
    },

    providerReference: {
      type: String,
      default: null,
      index: true
    },

    providerStatus: {
      type: String,
      default: null
    },

    description: {
      type: String,
      default: null
    },

    failureCode: {
      type: String,
      default: null
    },

    failureMessage: {
      type: String,
      default: null
    },

    submissionAttempts: {
      type: Number,
      default: 0
    },

    submittedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    reconciliationRequired: {
      type: Boolean,
      default: false,
      index: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

transferSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true }
);

transferSchema.index({
  status: 1,
  reconciliationRequired: 1,
  updatedAt: 1
});

const Transfer = mongoose.models.SkyDropTransfer ||
  mongoose.model('SkyDropTransfer', transferSchema);

function toPublicTransfer(doc) {
  if (!doc) {
    return null;
  }

  const transfer = typeof doc.toObject === 'function'
    ? doc.toObject()
    : { ...doc };

  delete transfer.destinationAccountNumber;
  delete transfer.requestHash;

  return transfer;
}

class TransferRepository {
  constructor(model = Transfer) {
    this.model = model;
  }

  async ensureIndexes() {
    await this.model.createIndexes();
  }

  async create(data) {
    try {
      const record = await this.model.create(data);
      return toPublicTransfer(record);
    } catch (error) {
      if (error.code === 11000) {
        error.code = 'DUPLICATE_TRANSFER';
        error.statusCode = 409;
      }

      throw error;
    }
  }

  async findById(reference, userId) {
    const query = { reference };

    if (userId) {
      query.userId = userId;
    }

    const record = await this.model
      .findOne(query)
      .select('+destinationAccountNumber');

    return record ? {
      ...toPublicTransfer(record),
      destinationAccountNumber: record.destinationAccountNumber
    } : null;
  }

  async findByIdempotencyKey(userId, idempotencyKey) {
    const record = await this.model.findOne({
      userId,
      idempotencyKey
    });

    return toPublicTransfer(record);
  }

  async updateStatus(reference, nextStatus, updates = {}) {
    const record = await this.model.findOne({ reference });

    if (!record) {
      const error = new Error('Transfer record not found.');
      error.code = 'TRANSFER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    assertTransition(record.status, nextStatus);

    const allowedUpdates = {
      status: nextStatus,
      ...updates
    };

    delete allowedUpdates._id;
    delete allowedUpdates.userId;
    delete allowedUpdates.reference;
    delete allowedUpdates.idempotencyKey;
    delete allowedUpdates.requestHash;
    delete allowedUpdates.amountKobo;
    delete allowedUpdates.destinationAccountNumber;
    delete allowedUpdates.destinationBankCode;

    Object.assign(record, allowedUpdates);

    await record.save();

    return toPublicTransfer(record);
  }

  async listByUser(userId, { limit = 20, cursor } = {}) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const query = { userId };

    if (cursor) {
      const cursorRecord = await this.model.findOne({
        reference: cursor,
        userId
      }).select('_id');

      if (!cursorRecord) {
        return { items: [], nextCursor: null };
      }

      query._id = { $lt: cursorRecord._id };
    }

    const records = await this.model
      .find(query)
      .sort({ _id: -1 })
      .limit(safeLimit + 1);

    const hasMore = records.length > safeLimit;
    const page = records.slice(0, safeLimit);
    const items = page.map(toPublicTransfer);

    return {
      items,
      nextCursor: hasMore
        ? items[items.length - 1].reference
        : null
    };
  }

  async findPendingReconciliation({ limit = 100 } = {}) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 100, 1),
      500
    );

    const records = await this.model
      .find({
        reconciliationRequired: true
      })
      .sort({ updatedAt: 1 })
      .limit(safeLimit);

    return records.map(toPublicTransfer);
  }

  async recordProviderSubmission(
    reference,
    {
      provider,
      providerReference,
      providerStatus
    }
  ) {
    const record = await this.model.findOne({ reference });

    if (!record) {
      const error = new Error('Transfer record not found.');
      error.code = 'TRANSFER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    record.provider = provider;
    record.providerReference = providerReference || null;
    record.providerStatus = providerStatus || null;
    record.submissionAttempts += 1;
    record.submittedAt = new Date();

    await record.save();

    return toPublicTransfer(record);
  }

  async markSubmissionUncertain(reference, message) {
    const record = await this.model.findOne({ reference });

    if (!record) {
      const error = new Error('Transfer record not found.');
      error.code = 'TRANSFER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (record.status !== TransferStatus.PROCESSING) {
      return toPublicTransfer(record);
    }

    record.status = TransferStatus.REQUIRES_RECONCILIATION;
    record.reconciliationRequired = true;
    record.failureCode = 'PROVIDER_SUBMISSION_UNCERTAIN';
    record.failureMessage = message || 'Provider outcome requires verification.';

    await record.save();

    return toPublicTransfer(record);
  }
}

module.exports = {
  Transfer,
  TransferRepository,
  toPublicTransfer
};
