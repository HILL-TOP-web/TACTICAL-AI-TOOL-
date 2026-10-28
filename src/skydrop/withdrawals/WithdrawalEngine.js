'use strict';

const crypto = require('node:crypto');
const mongoose = require('mongoose');

const { validateWithdrawal } = require('./WithdrawalValidator');

class WithdrawalEngine {
  constructor({
    repository,
    transferEngine,
    transactionService,
    walletService,
    ledgerService,
    gateway,
    env = process.env
  }) {
    const dependencies = {
      repository,
      transferEngine,
      transactionService,
      walletService,
      ledgerService,
      gateway
    };

    for (const [name, dependency] of Object.entries(dependencies)) {
      if (!dependency) {
        throw new Error(
          `WithdrawalEngine requires ${name}.`
        );
      }
    }

    Object.assign(this, dependencies, { env });
  }

  async request(userId, input) {
    if (!userId) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      throw error;
    }

    if (!mongoose.isValidObjectId(userId)) {
      const error = new Error('Invalid authenticated user ID.');
      error.statusCode = 400;
      throw error;
    }

    const data = validateWithdrawal(input, this.env);

    // Return an existing request for a repeated idempotency key.
    const existing = await this.repository.findByUserAndKey(
      userId,
      data.idempotencyKey
    );

    if (existing) {
      return existing;
    }

    const withdrawalId = new mongoose.Types.ObjectId();

    const providerReference =
      `SKDW-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;

    // The existing wallet/ledger service must implement this atomically.
    const reservation = await this.walletService.reserveWithdrawal({
      userId,
      amountNgn: data.amountNgn,
      currency: 'NGN',
      reference: providerReference,
      idempotencyKey: data.idempotencyKey
    });

    let record;

    try {
      record = await this.repository.create({
        _id: withdrawalId,
        userId,
        ...data,
        providerReference,
        status: 'PENDING',
        metadata: {
          ledgerReference:
            reservation.reference || providerReference
        }
      });
    } catch (error) {
      // Release the reservation if record creation fails.
      await this.walletService.releaseWithdrawalReservation({
        userId,
        reference: providerReference,
        idempotencyKey: data.idempotencyKey
      }).catch(() => {});

      // A duplicate key can mean another request won the race.
      if (error.code === 11000) {
        const duplicate = await this.repository.findByUserAndKey(
          userId,
          data.idempotencyKey
        );

        if (duplicate) {
          return duplicate;
        }
      }

      throw error;
    }

    try {
      await this.transactionService.createPendingWithdrawal({
        userId,
        withdrawalId: record._id,
        amountNgn: data.amountNgn,
        reference: providerReference,
        idempotencyKey: data.idempotencyKey,
        method: data.method
      });

      await this.repository.updateStatus(
        record._id,
        'PROCESSING'
      );

      const payload = {
        ...record.toObject(),
        ...data,
        providerReference
      };

      // TransferEngine is the preferred shared transfer path.
      const provider =
        typeof this.transferEngine.submitWithdrawal === 'function'
          ? await this.transferEngine.submitWithdrawal(payload)
          : await this.gateway.initiate(payload);

      const providerStatus = String(
        provider.status || provider.responseMessage || 'PENDING'
      ).toUpperCase();

      // HTTP acceptance alone does not mean the transfer succeeded.
      const status =
        provider.success === true &&
        /SUCCESS|COMPLETED|PAID/.test(providerStatus)
          ? 'SUCCESS'
          : provider.success === false &&
            /FAILED|REJECTED/.test(providerStatus)
            ? 'FAILED'
            : 'PROCESSING';

      const updated = await this.repository.updateStatus(
        record._id,
        status,
        {
          providerStatus,
          metadata: {
            ...(record.metadata || {}),
            providerResponse: sanitizeProvider(provider)
          }
        }
      );

      await this.transactionService.updateWithdrawalStatus({
        withdrawalId: record._id,
        status,
        providerStatus,
        providerReference
      });

      if (status === 'SUCCESS') {
        await this.walletService.commitWithdrawalReservation({
          userId,
          reference: providerReference
        });
      }

      if (status === 'FAILED') {
        await this.walletService.releaseWithdrawalReservation({
          userId,
          reference: providerReference,
          idempotencyKey: data.idempotencyKey
        });
      }

      return updated;
    } catch (error) {
      // Do not automatically release money when provider status is uncertain.
      await this.repository.updateStatus(
        record._id,
        'UNKNOWN',
        {
          failureReason:
            'Provider result uncertain; reconciliation required.'
        }
      ).catch(() => {});

      await this.transactionService.updateWithdrawalStatus({
        withdrawalId: record._id,
        status: 'UNKNOWN',
        providerReference
      }).catch(() => {});

      const uncertain = new Error(
        'Withdrawal confirmation is uncertain. Check the withdrawal status before retrying.'
      );

      uncertain.statusCode = 202;
      uncertain.withdrawalId = String(record._id);

      throw uncertain;
    }
  }
}

function sanitizeProvider(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const copy = { ...value };

  delete copy.token;
  delete copy.accessToken;
  delete copy.authorization;

  return copy;
}

module.exports = {
  WithdrawalEngine
};
