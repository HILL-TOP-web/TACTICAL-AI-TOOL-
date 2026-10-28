'use strict';

const {
  validateUserId,
  validateTransferRequest
} = require('./TransferValidator');

class TransferService {
  constructor({ engine, config = {} }) {
    if (!engine) {
      throw new Error('TransferEngine is required.');
    }

    this.engine = engine;
    this.config = config;
  }

  async createTransfer({ userId, input }) {
    const validUserId = validateUserId(userId);

    const request = validateTransferRequest(
      input,
      this.config
    );

    return this.engine.initiate({
      userId: validUserId,
      request
    });
  }

  async getTransfer({ userId, reference }) {
    const validUserId = validateUserId(userId);

    if (
      typeof reference !== 'string' ||
      !reference.trim()
    ) {
      const error = new Error('A transfer reference is required.');
      error.code = 'INVALID_TRANSFER_REFERENCE';
      error.statusCode = 400;
      throw error;
    }

    const transfer = await this.engine.getTransfer({
      reference: reference.trim(),
      userId: validUserId
    });

    if (!transfer) {
      const error = new Error('Transfer not found.');
      error.code = 'TRANSFER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return transfer;
  }

  async getTransferHistory({ userId, limit, cursor }) {
    const validUserId = validateUserId(userId);

    return this.engine.listTransfers({
      userId: validUserId,
      limit,
      cursor
    });
  }

  async reconcileTransfer({ reference }) {
    if (!reference || typeof reference !== 'string') {
      const error = new Error('A valid transfer reference is required.');
      error.code = 'INVALID_TRANSFER_REFERENCE';
      error.statusCode = 400;
      throw error;
    }

    return this.engine.reconcileTransfer({
      reference: reference.trim()
    });
  }
}

module.exports = TransferService;
