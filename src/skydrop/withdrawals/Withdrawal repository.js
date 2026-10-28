'use strict';

const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    amountNgn: {
      type: Number,
      required: true,
      min: 100
    },

    currency: {
      type: String,
      default: 'NGN',
      immutable: true
    },

    method: {
      type: String,
      enum: ['monnify'],
      required: true
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'REVERSED',
        'UNKNOWN'
      ],
      default: 'PENDING',
      index: true
    },

    recipientAccountNumber: {
      type: String,
      required: true,
      select: false
    },

    recipientAccountName: {
      type: String,
      required: true
    },

    bankCode: {
      type: String,
      required: true
    },

    idempotencyKey: {
      type: String,
      required: true
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

    failureReason: {
      type: String,
      default: null
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
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

// Prevent duplicate requests for the same user and idempotency key.
withdrawalSchema.index(
  {
    userId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

const Withdrawal =
  mongoose.models.SkyDropWithdrawal ||
  mongoose.model(
    'SkyDropWithdrawal',
    withdrawalSchema
  );

class WithdrawalRepository {
  async create(data) {
    return Withdrawal.create(data);
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }

    return Withdrawal.findById(id)
      .select('+recipientAccountNumber');
  }

  async findByUserAndKey(userId, key) {
    return Withdrawal.findOne({
      userId,
      idempotencyKey: key
    }).select('+recipientAccountNumber');
  }

  async updateStatus(id, status, fields = {}) {
    const allowedStatuses = [
      'PENDING',
      'PROCESSING',
      'SUCCESS',
      'FAILED',
      'REVERSED',
      'UNKNOWN'
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid withdrawal status.');
    }

    const allowedFields = [
      'providerStatus',
      'providerReference',
      'failureReason',
      'metadata',
      'transactionId'
    ];

    const updates = {
      status
    };

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(fields, field)
      ) {
        updates[field] = fields[field];
      }
    }

    return Withdrawal.findByIdAndUpdate(
      id,
      {
        $set: updates
      },
      {
        new: true,
        runValidators: true
      }
    ).select('+recipientAccountNumber');
  }

  async listForUser(userId, limit = 50) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    return Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit);
  }
}

module.exports = {
  WithdrawalRepository,
  Withdrawal,
  withdrawalSchema
};
