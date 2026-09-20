/**
 * Convert SkyDrop SKD to USD.
 *
 * Example:
 * 1 SKD = $2,000
 * 0.5 SKD = $1,000
 */

const conversionConfig = require("./conversionConfig");

function skdToUsd(skdAmount) {
  const amount = Number(skdAmount);

  if (!Number.isFinite(amount)) {
    throw new TypeError("SKD amount must be a valid number.");
  }

  if (amount < 0) {
    throw new RangeError("SKD amount cannot be negative.");
  }

  return amount * conversionConfig.rates.skdToUsd;
}

module.exports = skdToUsd;
