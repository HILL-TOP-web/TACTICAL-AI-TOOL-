'use strict';

const crypto = require('node:crypto');

class TransferValidationError extends Error {
  constructor(message, code = 'TRANSFER_VALIDATION_ERROR') {
    super(message);
    this.name = 'TransferValidationError';
    this.code = code;
    this.statusCode = 400;
  }
}

function requireText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TransferValidationError(
      `${fieldName} is required.`,
      `INVALID_${fieldName.toUpperCase()}`
    );
  }

  return value.trim();
}

function validateUserId(userId) {
  return requireText(userId, 'userId');
}

function validateIdempotencyKey(value) {
  const key = requireText(value, 'idempotencyKey');

  if (key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw new TransferValidationError(
      'The idempotency key has an invalid format.',
      'INVALID_IDEMPOTENCY_KEY'
    );
  }

  return key;
}

function validateAmount(amount, config = {}) {
  const minimum = Number(config.minimumAmount ?? 100);
  const maximum = config.maximumAmount == null
    ? Infinity
    : Number(config.maximumAmount);

  if (
    typeof amount !== 'number' ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new TransferValidationError(
      'Amount must be a positive integer in NGN kobo.',
      'INVALID_TRANSFER_AMOUNT'
    );
  }

  if (!Number.isFinite(minimum) || minimum < 0) {
    throw new Error('Invalid transfer minimum configuration.');
  }

  if (
    maximum !== Infinity &&
    (!Number.isFinite(maximum) || maximum < minimum)
  ) {
    throw new Error('Invalid transfer maximum configuration.');
  }

  const minimumKobo = Math.round(minimum * 100);
  const maximumKobo = maximum === Infinity
    ? Infinity
    : Math.round(maximum * 100);

  if (amount < minimumKobo) {
    throw new TransferValidationError(
      `The minimum transfer amount is ₦${minimum.toLocaleString('en-NG')}.`,
      'TRANSFER_AMOUNT_BELOW_MINIMUM'
    );
  }

  if (amount > maximumKobo) {
    throw new TransferValidationError(
      'The transfer amount exceeds the permitted limit.',
      'TRANSFER_AMOUNT_ABOVE_MAXIMUM'
    );
  }

  return amount;
}

function validateDestinationAccount(accountNumber) {
  const account = requireText(
    accountNumber,
    'destinationAccountNumber'
  );

  if (!/^\d{10}$/.test(account)) {
    throw new TransferValidationError(
      'A valid 10-digit Nigerian bank account number is required.',
      'INVALID_DESTINATION_ACCOUNT'
    );
  }

  return account;
}

function validateBankCode(bankCode) {
  const code = requireText(bankCode, 'bankCode');

  if (!/^[A-Za-z0-9_-]{2,20}$/.test(code)) {
    throw new TransferValidationError(
      'The bank code has an invalid format.',
      'INVALID_BANK_CODE'
    );
  }

  return code;
}

function validateCurrency(currency) {
  if (currency !== 'NGN') {
    throw new TransferValidationError(
      'Only NGN transfers are supported by this transfer configuration.',
      'UNSUPPORTED_TRANSFER_CURRENCY'
    );
  }

  return currency;
}

function validateTransferRequest(input, config = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TransferValidationError(
      'A valid transfer request is required.'
    );
  }

  const allowedFields = new Set([
    'amount',
    'currency',
    'destinationAccountNumber',
    'destinationBankCode',
    'destinationAccountName',
    'description',
    'idempotencyKey'
  ]);

  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new TransferValidationError(
        `Unsupported transfer field: ${field}`,
        'UNSUPPORTED_TRANSFER_FIELD'
      );
    }
  }

  const destinationAccountName = input.destinationAccountName == null
    ? undefined
    : requireText(
        input.destinationAccountName,
        'destinationAccountName'
      );

  if (
    destinationAccountName &&
    destinationAccountName.length > 120
  ) {
    throw new TransferValidationError(
      'The recipient account name is too long.'
    );
  }

  const description = input.description == null
    ? undefined
    : requireText(input.description, 'description');

  if (description && description.length > 200) {
    throw new TransferValidationError(
      'The transfer description must not exceed 200 characters.'
    );
  }

  return Object.freeze({
    amount: validateAmount(input.amount, config),
    currency: validateCurrency(input.currency ?? 'NGN'),
    destinationAccountNumber: validateDestinationAccount(
      input.destinationAccountNumber
    ),
    destinationBankCode: validateBankCode(
      input.destinationBankCode
    ),
    destinationAccountName,
    description,
    idempotencyKey: validateIdempotencyKey(input.idempotencyKey)
  });
}

function createTransferReference(prefix = 'SKDTRF') {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

module.exports = {
  TransferValidationError,
  validateUserId,
  validateIdempotencyKey,
  validateAmount,
  validateDestinationAccount,
  validateBankCode,
  validateCurrency,
  validateTransferRequest,
  createTransferReference
};
