"use strict";

const MIN_WITHDRAWAL_NGN = 100;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return String(value).trim().toLowerCase() === "true";
}

function parsePositiveInteger(value, name, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`INVALID_${name.toUpperCase()}`);
  }

  return parsed;
}

function loadWithdrawalConfig(env = process.env) {
  const minimum = parsePositiveInteger(
    env.SKYDROP_MIN_WITHDRAWAL_NGN,
    "minimum_withdrawal_ngn",
    MIN_WITHDRAWAL_NGN
  );

  if (minimum < MIN_WITHDRAWAL_NGN) {
    throw new Error("MINIMUM_WITHDRAWAL_CANNOT_BE_BELOW_NGN_100");
  }

  const maximumRaw = env.SKYDROP_MAX_WITHDRAWAL_NGN;

  let maximum = null;

  if (
    maximumRaw !== undefined &&
    maximumRaw !== null &&
    maximumRaw.trim() !== "" &&
    maximumRaw.trim().toLowerCase() !== "null"
  ) {
    maximum = parsePositiveInteger(
      maximumRaw,
      "maximum_withdrawal_ngn",
      null
    );

    if (maximum < minimum) {
      throw new Error("MAXIMUM_WITHDRAWAL_BELOW_MINIMUM");
    }
  }

  return Object.freeze({
    enabled: parseBoolean(
      env.SKYDROP_WITHDRAWALS_ENABLED,
      false
    ),

    minimumWithdrawalNGN: minimum,

    // null means no application-level maximum.
    // Provider, regulatory, and account limits may still apply.
    maximumWithdrawalNGN: maximum,

    currency: "NGN",

    requireIdempotencyKey: true,

    requireProviderConfirmation: true
  });
}

function validateWithdrawalAmount(amount, config = loadWithdrawalConfig()) {
  const value = Number(amount);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("INVALID_WITHDRAWAL_AMOUNT");
  }

  if (value < config.minimumWithdrawalNGN) {
    throw new Error("WITHDRAWAL_BELOW_MINIMUM");
  }

  if (
    config.maximumWithdrawalNGN !== null &&
    value > config.maximumWithdrawalNGN
  ) {
    throw new Error("WITHDRAWAL_ABOVE_MAXIMUM");
  }

  return value;
}

function assertWithdrawalsEnabled(config = loadWithdrawalConfig()) {
  if (!config.enabled) {
    throw new Error("WITHDRAWALS_DISABLED");
  }
}

module.exports = {
  MIN_WITHDRAWAL_NGN,
  loadWithdrawalConfig,
  validateWithdrawalAmount,
  assertWithdrawalsEnabled
};
