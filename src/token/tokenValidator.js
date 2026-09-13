'use strict';

/**
 * Token validation utilities.
 *
 * Amounts are represented internally as BigInt
 * to avoid JavaScript floating-point precision
 * problems with token balances.
 */

/**
 * Parse a token amount safely.
 */
function parseAmount(amount) {
  if (typeof amount === 'bigint') {
    if (amount < 0n) {
      throw new Error('Token amount cannot be negative.');
    }

    return amount;
  }

  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      throw new Error('Token amount must be finite.');
    }

    if (!Number.isInteger(amount)) {
      throw new Error(
        'Token amount must be an integer base-unit value.'
      );
    }

    if (!Number.isSafeInteger(amount)) {
      throw new Error(
        'Token amount exceeds JavaScript safe integer range.'
      );
    }

    if (amount < 0) {
      throw new Error(
        'Token amount cannot be negative.'
      );
    }

    return BigInt(amount);
  }

  if (typeof amount === 'string') {
    const normalized = amount.trim();

    if (!/^\d+$/.test(normalized)) {
      throw new Error(
        'Token amount must contain only digits.'
      );
    }

    return BigInt(normalized);
  }

  throw new Error(
    'Invalid token amount type.'
  );
}

/**
 * Validate a wallet/address identifier.
 *
 * This intentionally accepts application-level wallet IDs
 * rather than assuming a specific blockchain address format.
 */
function validateAddress(address) {
  if (
    typeof address !== 'string' ||
    address.trim().length === 0
  ) {
    throw new Error(
      'A valid wallet address is required.'
    );
  }

  if (address.length > 128) {
    throw new Error(
      'Wallet address is too long.'
    );
  }

  return address.trim();
}

/**
 * Validate token symbol.
 */
function validateSymbol(symbol) {
  if (typeof symbol !== 'string') {
    throw new Error(
      'Token symbol must be a string.'
    );
  }

  const normalized = symbol.trim().toUpperCase();

  if (!/^[A-Z0-9]{2,12}$/.test(normalized)) {
    throw new Error(
      'Invalid token symbol.'
    );
  }

  return normalized;
}

/**
 * Validate token decimals.
 */
function validateDecimals(decimals) {
  if (!Number.isInteger(decimals)) {
    throw new Error(
      'Token decimals must be an integer.'
    );
  }

  if (decimals < 0 || decimals > 36) {
    throw new Error(
      'Token decimals must be between 0 and 36.'
    );
  }

  return decimals;
}

/**
 * Validate a transfer.
 */
function validateTransfer(from, to, amount) {
  validateAddress(from);
  validateAddress(to);

  if (from === to) {
    throw new Error(
      'Sender and recipient cannot be identical.'
    );
  }

  const value = parseAmount(amount);

  if (value <= 0n) {
    throw new Error(
      'Transfer amount must be greater than zero.'
    );
  }

  return true;
}

/**
 * Validate mint operation.
 */
function validateMint(address, amount) {
  validateAddress(address);

  const value = parseAmount(amount);

  if (value <= 0n) {
    throw new Error(
      'Mint amount must be greater than zero.'
    );
  }

  return true;
}

/**
 * Validate burn operation.
 */
function validateBurn(address, amount) {
  validateAddress(address);

  const value = parseAmount(amount);

  if (value <= 0n) {
    throw new Error(
      'Burn amount must be greater than zero.'
    );
  }

  return true;
}

module.exports = {
  parseAmount,
  validateAddress,
  validateSymbol,
  validateDecimals,
  validateTransfer,
  validateMint,
  validateBurn
};
