"use strict";

const WithdrawalConfig = require("./WithdrawalConfig");

class WithdrawalLimits {
static getMinimum() {
return WithdrawalConfig.minimumWithdrawalNGN;
}

static getMaximum() {
// SkyDrop has no configured maximum withdrawal amount.
return null;
}

static validate(amount) {
const value = Number(amount);

if (!Number.isFinite(value) || value <= 0) {
  return {
    valid: false,
    code: "INVALID_AMOUNT",
    message: "Withdrawal amount must be greater than zero."
  };
}

if (value < this.getMinimum()) {
  return {
    valid: false,
    code: "WITHDRAWAL_BELOW_MINIMUM",
    message: `Minimum withdrawal is ₦${this.getMinimum()}.`
  };
}

if (Math.round(value * 100) !== value * 100) {
  return {
    valid: false,
    code: "INVALID_AMOUNT_PRECISION",
    message: "Withdrawal amount cannot exceed two decimal places."
  };
}

return {
  valid: true,
  amount: Math.round(value * 100) / 100,
  currency: "NGN"
};

}

static assertValid(amount) {
const result = this.validate(amount);

if (!result.valid) {
  const error = new Error(result.message);
  error.code = result.code;
  throw error;
}

return result.amount;

}
}

module.exports = WithdrawalLimits;
