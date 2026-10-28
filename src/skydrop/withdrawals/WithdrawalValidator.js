'use strict';

const {
  getWithdrawalConfig
} = require('./WithdrawalConfig');

const {
  getWithdrawalLimits
} = require('./WithdrawalLimits');

class WithdrawalValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);

    this.name = 'WithdrawalValidationError';
    this.statusCode = statusCode;
  }
}

function validateWithdrawal(input, env = process.env) {
  const config = getWithdrawalConfig(env);
  const limits = getWithdrawalLimits(env);

  if (!config.enabled) {
    throw new WithdrawalValidationError(
      'Withdrawals are currently disabled.',
      503
    );
  }

  if (
    !config.monnifyEnabled ||
    !config.bankWithdrawalsEnabled
  ) {
    throw new WithdrawalValidationError(
      'Monnify bank withdrawals are not enabled.',
      503
    );
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new WithdrawalValidationError(
      'Withdrawal details are required.'
    );
  }

  const amount = Number(
    input.amountNgn ?? input.amount
  );

  if (
    !Number.isSafeInteger(amount) ||
    amount < limits.minimumNgn
  ) {
    throw new WithdrawalValidationError(
      `Amount must be a whole NGN amount of at least ₦${limits.minimumNgn}.`
    );
  }

  const accountNumber = String(
    input.recipientAccountNumber || ''
  ).replace(/\s/g, '');

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new WithdrawalValidationError(
      'Recipient account number must contain exactly 10 digits.'
    );
  }

  const bankCode = String(
    input.bankCode || ''
  ).trim();

  if (!bankCode) {
    throw new WithdrawalValidationError(
      'A Monnify-supported recipient bank code is required.'
    );
  }

  const accountName = String(
    input.recipientAccountName || ''
  ).trim();

  if (
    accountName.length < 2 ||
    accountName.length > 120
  ) {
    throw new WithdrawalValidationError(
      'A verified recipient account name is required.'
    );
  }

  const idempotencyKey = String(
    input.idempotencyKey || ''
  ).trim();

  if (
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128
  ) {
    throw new WithdrawalValidationError(
      'Provide an idempotencyKey between 8 and 128 characters.'
    );
  }

  return {
    amountNgn: amount,
    currency: 'NGN',
    method: 'monnify',
    recipientAccountNumber: accountNumber,
    recipientAccountName: accountName,
    bankCode,
    idempotencyKey,
    narration: String(
      input.narration || 'SkyDrop withdrawal'
    ).slice(0, 100)
  };
}

module.exports = {
  validateWithdrawal,
  WithdrawalValidationError
};
