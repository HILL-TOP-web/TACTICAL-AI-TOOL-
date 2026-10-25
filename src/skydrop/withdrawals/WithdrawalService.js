"use strict";

const {
  loadWithdrawalConfig
} = require("./WithdrawalConfig");

const {
  WithdrawalLimits
} = require("./WithdrawalLimits");

const {
  WithdrawalValidator
} = require("./WithdrawalValidator");

const {
  WithdrawalMethods,
  normalizeMethod
} = require("./WithdrawalMethods");

class WithdrawalService {
  constructor({
    withdrawalEngine,
    validator = new WithdrawalValidator(),
    limits = new WithdrawalLimits(),
    configProvider = loadWithdrawalConfig
  }) {
    if (
      !withdrawalEngine ||
      typeof withdrawalEngine.requestWithdrawal !==
        "function"
    ) {
      throw new Error("WITHDRAWAL_ENGINE_REQUIRED");
    }

    this.withdrawalEngine = withdrawalEngine;
    this.validator = validator;
    this.limits = limits;
    this.configProvider = configProvider;
  }

  getConfiguration() {
    const config = this.configProvider();

    return {
      enabled: config.enabled,
      currency: config.currency,
      minimumWithdrawalNGN:
        config.minimumWithdrawalNGN,
      maximumWithdrawalNGN:
        config.maximumWithdrawalNGN
    };
  }

  getLimits() {
    return this.limits.getLimits();
  }

  async request(input) {
    const config = this.configProvider();

    if (!config.enabled) {
      throw new Error("WITHDRAWALS_DISABLED");
    }

    const validated = this.validator.validate(input);

    this.limits.validate(validated.amountNGN);

    const method = normalizeMethod(validated.method);

    if (method !== WithdrawalMethods.MONNIFY) {
      throw new Error("WITHDRAWAL_METHOD_NOT_IMPLEMENTED");
    }

    return this.withdrawalEngine.requestWithdrawal({
      ...validated,
      method
    });
  }
}

module.exports = {
  WithdrawalService
};
