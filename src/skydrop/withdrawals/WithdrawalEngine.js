'use strict';

const crypto = require('node:crypto');

const {
  assertWithdrawalEnabled,
  getWithdrawalConfig
} = require('./WithdrawalConfig');

const {
  MonnifyWithdrawalGateway
} = require('./MonnifyWithdrawalGateway');

class WithdrawalEngine {
  constructor({
    repository,
    gateway = new MonnifyWithdrawalGateway()
  } = {}) {
    const requiredMethods = [
      'createAndReserve',
      'updateSubmission',
      'findByReference',
      'findByProviderReference',
      'settleProviderStatus'
    ];

    if (
      !repository ||
      requiredMethods.some(
        method => typeof repository[method] !== 'function'
      )
    ) {
      throw new Error(
        'WithdrawalEngine requires a persistent repository implementing: ' +
        requiredMethods.join(', ')
      );
    }

    this.repository = repository;
    this.gateway = gateway;
  }

  async requestWithdrawal(input) {
    assertWithdrawalEnabled();

    const config = getWithdrawalConfig();
    const amount = Number(input.amountNgn);

    if (!input.userId) {
      const error = new Error(
        'Authenticated user is required.'
      );

      error.statusCode = 401;
      throw error;
    }

    if (
      !Number.isFinite(amount) ||
      amount < config.minAmountNgn ||
      Math.round(amount * 100) !== amount * 100
    ) {
      const error = new Error(
        'Withdrawal must be at least ₦100 and have at most two decimal places.'
      );

      error.statusCode = 400;
      throw error;
    }

    const requiredFields = [
      'destinationBankCode',
      'destinationAccountNumber',
      'destinationAccountName'
    ];

    for (const field of requiredFields) {
      if (
        typeof input[field] !== 'string' ||
        !input[field].trim()
      ) {
        const error = new Error(
          `Missing ${field}.`
        );

        error.statusCode = 400;
        throw error;
      }
    }

    const bankCode = input.destinationBankCode.trim();
    const accountNumber = input.destinationAccountNumber.trim();
    const accountName = input.destinationAccountName.trim();

    if (!/^\d{3}$/.test(bankCode)) {
      const error = new Error(
        'Bank code must contain three digits.'
      );

      error.statusCode = 400;
      throw error;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      const error = new Error(
        'Nigerian bank account number must contain ten digits.'
      );

      error.statusCode = 400;
      throw error;
    }

    const idempotencyKey = String(
      input.idempotencyKey || ''
    ).trim();

    if (
      idempotencyKey.length < 12 ||
      idempotencyKey.length > 128
    ) {
      const error = new Error(
        'An Idempotency-Key header of 12–128 characters is required.'
      );

      error.statusCode = 400;
      throw error;
    }

    const reference = `SKDWD-${crypto.randomUUID()}`;

    // The repository must atomically reserve the user's available funds
    // and create a durable withdrawal record.
    const withdrawal = await this.repository.createAndReserve({
      userId: String(input.userId),
      amountNgn: amount,
      currency: 'NGN',
      reference,
      idempotencyKey,
      destinationBankCode: bankCode,
      destinationAccountNumber: accountNumber,
      destinationAccountName: accountName,
      status: 'RESERVED'
    });

    // An idempotent retry returns the original record.
    if (
      withdrawal.existing ||
      withdrawal.status !== 'RESERVED'
    ) {
      return withdrawal;
    }

    try {
      // WithdrawalEngine -> MonnifyWithdrawalGateway -> MonnifyDisbursement.
      const provider = await this.gateway.send({
        ...withdrawal,
        amountNgn: amount,
        reference: withdrawal.reference || reference,
        providerReference:
          withdrawal.providerReference ||
          withdrawal.reference ||
          reference,
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        destinationAccountName: accountName
      });

      const status = normalizeSubmissionStatus(
        provider.providerStatus
      );

      return await this.repository.updateSubmission(
        withdrawal.id,
        {
          status,
          providerReference: provider.providerReference,
          providerStatus: provider.providerStatus,
          submittedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      // A timeout or server error does not prove that the provider
      // rejected the transfer. Keep funds reserved until reconciliation.
      const outcomeUnknown =
        error.outcomeUnknown ||
        error.code === 'PROVIDER_OUTCOME_UNKNOWN' ||
        error.name === 'AbortError' ||
        !Number.isInteger(error.httpStatus) ||
        error.httpStatus >= 500;

      if (outcomeUnknown) {
        return this.repository.updateSubmission(
          withdrawal.id,
          {
            status: 'UNKNOWN',
            providerStatus: 'UNKNOWN',
            failureCode: 'PROVIDER_OUTCOME_UNKNOWN',
            failureMessage: String(
              error.message ||
              'Provider request outcome is unknown.'
            ).slice(0, 250)
          }
        );
      }

      // A definitive provider rejection is recorded as failed.
      // The repository handles the refund exactly once.
      return this.repository.settleProviderStatus(
        withdrawal.id,
        'FAILED',
        {
          providerStatus: 'REJECTED',
          failureCode: 'PROVIDER_REJECTED',
          failureMessage: String(
            error.message ||
            'Provider rejected the request.'
          ).slice(0, 250),
          checkedAt: new Date().toISOString()
        }
      );
    }
  }

  async authorizeWithdrawal(input) {
    assertWithdrawalEnabled();

    if (!input.userId) {
      const error = new Error(
        'Authenticated user is required.'
      );

      error.statusCode = 401;
      throw error;
    }

    const reference = String(
      input.reference || ''
    ).trim();

    const authorizationCode = String(
      input.authorizationCode || ''
    ).trim();

    if (!reference) {
      const error = new Error(
        'Withdrawal reference is required.'
      );

      error.statusCode = 400;
      throw error;
    }

    if (!/^\d{4,8}$/.test(authorizationCode)) {
      const error = new Error(
        'Authorization code must contain 4–8 digits.'
      );

      error.statusCode = 400;
      throw error;
    }

    const withdrawal = await this.repository.findByReference(
      reference
    );

    if (
      !withdrawal ||
      withdrawal.userId !== String(input.userId)
    ) {
      const error = new Error(
        'Withdrawal not found.'
      );

      error.statusCode = 404;
      throw error;
    }

    if (withdrawal.status !== 'PENDING_AUTHORIZATION') {
      const error = new Error(
        'This withdrawal is not waiting for authorization.'
      );

      error.statusCode = 409;
      throw error;
    }

    try {
      const provider = await this.gateway.authorize(
        withdrawal.providerReference || withdrawal.reference,
        authorizationCode
      );

      const status = normalizeSubmissionStatus(
        provider.providerStatus
      );

      if (
        status === 'SUCCEEDED' ||
        status === 'FAILED'
      ) {
        return this.repository.settleProviderStatus(
          withdrawal.id,
          status,
          {
            providerStatus: provider.providerStatus,
            providerReference: provider.providerReference,
            checkedAt: new Date().toISOString()
          }
        );
      }

      return this.repository.updateSubmission(
        withdrawal.id,
        {
          status,
          providerReference: provider.providerReference,
          providerStatus: provider.providerStatus,
          submittedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      // An unsuccessful OTP attempt does not prove the original
      // transfer failed. Keep the funds reserved.
      return this.repository.updateSubmission(
        withdrawal.id,
        {
          status: 'PENDING_AUTHORIZATION',
          providerStatus: 'PENDING_AUTHORIZATION',
          failureCode: 'AUTHORIZATION_ATTEMPT_FAILED',
          failureMessage: String(
            error.message || 'Authorization failed.'
          ).slice(0, 250)
        }
      );
    }
  }
}

function normalizeSubmissionStatus(status) {
  const value = String(
    status || 'PENDING'
  ).toUpperCase();

  if (
    value === 'SUCCESS' ||
    value === 'COMPLETED' ||
    value === 'SUCCEEDED'
  ) {
    return 'SUCCEEDED';
  }

  if (value === 'PENDING_AUTHORIZATION') {
    return 'PENDING_AUTHORIZATION';
  }

  if (
    value === 'FAILED' ||
    value === 'EXPIRED' ||
    value === 'REVERSED'
  ) {
    return 'FAILED';
  }

  return 'PENDING';
}

module.exports = {
  WithdrawalEngine,
  normalizeSubmissionStatus
};
