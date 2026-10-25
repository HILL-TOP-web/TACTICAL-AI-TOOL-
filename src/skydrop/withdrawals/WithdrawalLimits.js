"use strict";

const {
  loadWithdrawalConfig
} = require("./WithdrawalConfig");

class WithdrawalLimits {
  constructor({
    configProvider = loadWithdrawalConfig
  } = {}) {
    this.configProvider = configProvider;
  }

  getLimits() {
    const config = this.configProvider();

    return {
      currency: "NGN",
      minimumWithdrawalNGN:
        config.minimumWithdrawalNGN,

      maximumWithdrawalNGN:
        config.maximumWithdrawalNGN
    };
  }

  validate(amountNGN) {
    const config = this.configProvider();

    if (
      !Number.isSafeInteger(amountNGN) ||
      amountNGN <= 0
    ) {
      throw new Error("INVALID_WITHDRAWAL_AMOUNT");
    }

    if (amountNGN < config.minimumWithdrawalNGN) {
      throw new Error("WITHDRAWAL_BELOW_MINIMUM");
    }

    if (
      config.maximumWithdrawalNGN !== null &&
      amountNGN > config.maximumWithdrawalNGN
    ) {
      throw new Error("WITHDRAWAL_ABOVE_MAXIMUM");
    }

    return {
      valid: true,
      amountNGN,
      currency: "NGN"
    };
  }
}

module.exports = {
  WithdrawalLimits
};
