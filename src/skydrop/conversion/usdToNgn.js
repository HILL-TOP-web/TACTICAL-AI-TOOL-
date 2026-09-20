/**
 * Convert USD to Nigerian Naira.
 *
 * Current configured rate:
 * $1 USD = ₦2,000 NGN
 *
 * Example:
 * $2,000 = ₦4,000,000
 */

const conversionConfig = require("./conversionConfig");

function usdToNgn(usdAmount) {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) {
    throw new TypeError("USD amount must be a valid number.");
  }

  if (amount < 0) {
    throw new RangeError("USD amount cannot be negative.");
  }

  return amount * conversionConfig.rates.usdToNgn;
}

module.exports = usdToNgn;
