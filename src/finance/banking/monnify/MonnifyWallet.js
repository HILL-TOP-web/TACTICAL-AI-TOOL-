// 2. src/finance/banking/monnify/MonnifyWallet.js

"use strict";

const MonnifyFunding = require("./MonnifyFunding");

class MonnifyWallet {
  constructor(options = {}) {
    this.client =
      options.client ||
      new MonnifyFunding(options);

    this.accountNumber =
      options.accountNumber ||
      process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;

    if (!this.accountNumber) {
      throw new Error(
        "MONNIFY_WALLET_ACCOUNT_NUMBER is required"
      );
    }
  }

  async getBalance() {
    const balance =
      await this.client.getWalletBalance(
        this.accountNumber
      );

    return {
      accountNumber:
        balance.accountNumber ||
        this.accountNumber,

      availableBalance: Number(
        balance.availableBalance || 0
      ),

      ledgerBalance: Number(
        balance.ledgerBalance || 0
      ),

      currency:
        balance.currency ||
        "NGN",

      retrievedAt:
        new Date().toISOString()
    };
  }

  async getWalletTransactions({
    pageNo = 0,
    pageSize = 20
  } = {}) {
    if (
      !Number.isInteger(Number(pageNo)) ||
      Number(pageNo) < 0
    ) {
      throw new Error(
        "pageNo must be a non-negative integer"
      );
    }

    if (
      !Number.isInteger(Number(pageSize)) ||
      Number(pageSize) < 1 ||
      Number(pageSize) > 100
    ) {
      throw new Error(
        "pageSize must be between 1 and 100"
      );
    }

    /*
     * The wallet transaction endpoint can vary by the
     * Monnify wallet product enabled on the account.
     *
     * Keep the route configurable instead of hard-coding
     * an undocumented endpoint.
     */
    const endpoint =
      process.env.MONNIFY_WALLET_TRANSACTIONS_PATH;

    if (!endpoint) {
      return {
        configured: false,
        message:
          "MONNIFY_WALLET_TRANSACTIONS_PATH is not configured.",
        pageNo: Number(pageNo),
        pageSize: Number(pageSize),
        transactions: []
      };
    }

    const separator =
      endpoint.includes("?") ? "&" : "?";

    const response =
      await this.client.authenticatedRequest(
        `${endpoint}${separator}pageNo=${encodeURIComponent(
          pageNo
        )}&pageSize=${encodeURIComponent(pageSize)}`,
        {
          method: "GET"
        }
      );

    if (!response?.requestSuccessful) {
      throw new Error(
        response?.responseMessage ||
          "Unable to retrieve Monnify wallet transactions"
      );
    }

    return response.responseBody;
  }

  async healthCheck() {
    const balance = await this.getBalance();

    return {
      status: "OK",
      provider: "MONNIFY",
      accountNumber: balance.accountNumber,
      currency: balance.currency,
      availableBalance: balance.availableBalance,
      ledgerBalance: balance.ledgerBalance,
      checkedAt: new Date().toISOString()
    };
  }

  async hasSufficientBalance(amount) {
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      throw new Error("Invalid amount");
    }

    const balance = await this.getBalance();

    return {
      sufficient:
        balance.availableBalance >= numericAmount,

      requestedAmount: numericAmount,

      availableBalance:
        balance.availableBalance,

      accountNumber:
        balance.accountNumber,

      currency:
        balance.currency
    };
  }

  async assertSufficientBalance(amount) {
    const result =
      await this.hasSufficientBalance(amount);

    if (!result.sufficient) {
      const error = new Error(
        "Insufficient Monnify wallet balance"
      );

      error.code = "MONNIFY_INSUFFICIENT_BALANCE";
      error.details = result;

      throw error;
    }

    return result;
  }
}

module.exports = MonnifyWallet;
