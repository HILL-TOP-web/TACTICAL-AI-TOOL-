'use strict';

const crypto = require('node:crypto');

const {
  TransferStatus
} = require('./TransferStatus');

const {
  createTransferReference
} = require('./TransferValidator');

class TransferEngine {
  constructor({
    repository,
    walletService,
    ledgerService,
    transactionService,
    provider,
    config = {}
  }) {
    if (!repository) {
      throw new Error('TransferRepository is required.');
    }

    if (!walletService) {
      throw new Error('Wallet service integration is required.');
    }

    if (!ledgerService) {
      throw new Error('Ledger service integration is required.');
    }

    if (!transactionService) {
      throw new Error('TransactionService integration is required.');
    }

    this.repository = repository;
    this.walletService = walletService;
    this.ledgerService = ledgerService;
    this.transactionService = transactionService;
    this.provider = provider || null;
    this.config = config;
  }

  createRequestHash(request) {
    const canonical = JSON.stringify({
      amount: request.amount,
      currency: request.currency,
      destinationAccountNumber: request.destinationAccountNumber,
      destinationBankCode: request.destinationBankCode,
      destinationAccountName: request.destinationAccountName || null,
      description: request.description || null
    });

    return crypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex');
  }

  async initiate({ userId, request }) {
    const requestHash = this.createRequestHash(request);

    const existing = await this.repository.findByIdempotencyKey(
      userId,
      request.idempotencyKey
    );

    if (existing) {
      if (existing.requestHash !== requestHash) {
        const error = new Error(
          'This idempotency key was already used for a different transfer.'
        );

        error.code = 'IDEMPOTENCY_KEY_REUSED';
        error.statusCode = 409;

        throw error;
      }

      return existing;
    }

    if (!this.provider) {
      const error = new Error(
        'No transfer provider has been configured.'
      );

      error.code = 'TRANSFER_PROVIDER_NOT_CONFIGURED';
      error.statusCode = 503;

      throw error;
    }

    /*
     * The following wallet/ledger operations must be implemented
     * using your actual service APIs and MongoDB transaction/session
     * strategy before enabling real transfers.
     *
     * Never debit funds merely because the provider accepted a request.
     * Reserve funds atomically and persist the transfer before submission.
     */

    const reference = createTransferReference();

    const transfer = await this.repository.create({
      userId,
      reference,
      idempotencyKey: request.idempotencyKey,
      requestHash,
      amountKobo: request.amount,
      currency: request.currency,
      destinationAccountNumber: request.destinationAccountNumber,
      destinationBankCode: request.destinationBankCode,
      destinationAccountName: request.destinationAccountName || null,
      description: request.description || null,
      status: TransferStatus.CREATED,
      reconciliationRequired: false
    });

    /*
     * Do not submit the payment until the project-specific
     * atomic wallet reservation and ledger posting have succeeded.
     *
     * The wallet and ledger APIs have not been verified here.
     * Failing closed is safer than inventing method names that could
     * incorrectly alter a user's balance.
     */

    const error = new Error(
      'Transfer record created, but wallet reservation and ledger integration must be completed before provider submission.'
    );

    error.code = 'TRANSFER_ACCOUNTING_INTEGRATION_REQUIRED';
    error.statusCode = 503;
    error.transferReference = reference;

    throw error;
  }

  async getTransfer({ reference, userId }) {
    return this.repository.findById(reference, userId);
  }

  async listTransfers({ userId, limit, cursor }) {
    return this.repository.listByUser(userId, { limit, cursor });
  }

  async reconcileTransfer({ reference }) {
    const transfer = await this.repository.findById(reference);

    if (!transfer) {
      const error = new Error('Transfer not found.');
      error.code = 'TRANSFER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (!this.provider) {
      const error = new Error('Transfer provider is unavailable.');
      error.code = 'TRANSFER_PROVIDER_NOT_CONFIGURED';
      error.statusCode = 503;
      throw error;
    }

    if (typeof this.provider.getTransferStatus !== 'function') {
      const error = new Error(
        'The provider status-verification method is not configured.'
      );

      error.code = 'PROVIDER_STATUS_VERIFICATION_UNAVAILABLE';
      error.statusCode = 503;

      throw error;
    }

    /*
     * The provider adapter must return a verified, normalized status.
     * Balance settlement and ledger reversal/confirmation must be
     * coordinated with your actual accounting services.
     */
    return this.provider.getTransferStatus({
      reference: transfer.reference,
      providerReference: transfer.providerReference
    });
  }
}

module.exports = TransferEngine;
