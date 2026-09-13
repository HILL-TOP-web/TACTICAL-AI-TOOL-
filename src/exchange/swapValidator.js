'use strict';

const SUPPORTED_ASSETS = new Set([
  'SKD',
  'USDT'
]);

function validateUserId(userId) {
  if (
    typeof userId !== 'string' ||
    userId.trim().length === 0
  ) {
    throw new Error(
      'A valid user ID is required.'
    );
  }

  if (userId.length > 128) {
    throw new Error(
      'User ID is too long.'
    );
  }

  return userId.trim();
}

function validateAsset(asset) {
  if (typeof asset !== 'string') {
    throw new Error(
      'Asset must be a string.'
    );
  }

  const normalized =
    asset.trim().toUpperCase();

  if (!SUPPORTED_ASSETS.has(normalized)) {
    throw new Error(
      `Unsupported asset: ${normalized}`
    );
  }

  return normalized;
}

function validateAmount(amount) {
  const value = Number(amount);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      'Swap amount must be greater than zero.'
    );
  }

  return value;
}

function validateRate(rate) {
  const value = Number(rate);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      'Exchange rate must be greater than zero.'
    );
  }

  return value;
}

function validateSwap({
  fromAsset,
  toAsset,
  amount,
  rate
}) {
  const from = validateAsset(fromAsset);
  const to = validateAsset(toAsset);

  if (from === to) {
    throw new Error(
      'Source and destination assets must be different.'
    );
  }

  validateAmount(amount);
  validateRate(rate);

  /*
   * SkyDrop currently supports SKD/USDT
   * as the exchange pair.
   */
  const validPair =
    from === 'SKD' && to === 'USDT';

  if (!validPair) {
    throw new Error(
      `Trading pair ${from}/${to} is not currently supported.`
    );
  }

  return true;
}

function isSupportedPair(
  fromAsset,
  toAsset
) {
  try {
    const from = validateAsset(fromAsset);
    const to = validateAsset(toAsset);

    return (
      from === 'SKD' &&
      to === 'USDT'
    );
  } catch {
    return false;
  }
}

module.exports = {
  SUPPORTED_ASSETS,
  validateUserId,
  validateAsset,
  validateAmount,
  validateRate,
  validateSwap,
  isSupportedPair
};
