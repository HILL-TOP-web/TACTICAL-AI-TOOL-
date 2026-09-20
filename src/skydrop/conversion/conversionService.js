/**
 * SkyDrop Conversion Service
 *
 * Handles:
 *
 * SKD → USD
 * USD → NGN
 * SKD → NGN
 *
 * Example:
 *
 * 1 SKD
 * ↓
 * $2,000 USD
 * ↓
 * ₦4,000,000 NGN
 */

const conversionConfig = require("./conversionConfig");
const skdToUsd = require("./skdToUsd");
const usdToNgn = require("./usdToNgn");

/**
 * Convert SKD to USD.
 */
function convertSkdToUsd(skdAmount) {
  return skdToUsd(skdAmount);
}

/**
 * Convert USD to NGN.
 */
function convertUsdToNgn(usdAmount) {
  return usdToNgn(usdAmount);
}

/**
 * Convert SKD directly to NGN.
 *
 * This follows:
 *
 * SKD → USD → NGN
 */
function convertSkdToNgn(skdAmount) {
  const usdAmount = skdToUsd(skdAmount);

  return usdToNgn(usdAmount);
}

/**
 * Convert SKD through the complete conversion chain.
 *
 * Returns both USD and NGN values.
 */
function convertSkd(skdAmount) {
  const amount = Number(skdAmount);

  if (!Number.isFinite(amount)) {
    throw new TypeError("SKD amount must be a valid number.");
  }

  if (amount < 0) {
    throw new RangeError("SKD amount cannot be negative.");
  }

  const usd = convertSkdToUsd(amount);
  const ngn = convertUsdToNgn(usd);

  return {
    skd: amount,
    usd,
    ngn,
    rates: {
      skdToUsd: conversionConfig.rates.skdToUsd,
      usdToNgn: conversionConfig.rates.usdToNgn,
      skdToNgn: conversionConfig.skdToNgn,
    },
  };
}

module.exports = {
  convertSkdToUsd,
  convertUsdToNgn,
  convertSkdToNgn,
  convertSkd,
};
