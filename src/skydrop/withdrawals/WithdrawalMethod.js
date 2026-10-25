"use strict";

const {
  WithdrawalMethods
} = require("./WithdrawalMethods");

function getWithdrawalMethodDetails() {
  return [
    {
      id: WithdrawalMethods.MONNIFY,
      name: "Monnify",
      currency: "NGN",
      enabled:
        String(process.env.MONNIFY_ENABLED).toLowerCase() ===
          "true" &&
        String(
          process.env.SKYDROP_WITHDRAWALS_ENABLED
        ).toLowerCase() === "true"
    },

    {
      id: WithdrawalMethods.BANK_TRANSFER,
      name: "Bank Transfer",
      currency: "NGN",
      enabled: false
    }
  ];
}

function getWithdrawalMethod(method) {
  const normalized = String(method || "")
    .trim()
    .toUpperCase();

  const result = getWithdrawalMethodDetails().find(
    (item) => item.id === normalized
  );

  if (!result) {
    throw new Error("UNSUPPORTED_WITHDRAWAL_METHOD");
  }

  return result;
}

module.exports = {
  getWithdrawalMethodDetails,
  getWithdrawalMethod
};
