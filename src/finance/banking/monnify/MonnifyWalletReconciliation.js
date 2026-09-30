// 4. src/finance/banking/monnify/MonnifyWalletReconciliation.js

"use strict";

const MonnifyWallet = require("./MonnifyWallet");

class MonnifyWalletReconciliation {
  constructor(options = {}) {
    this.wallet =
      options.wallet ||
      new MonnifyWallet(options);

    this.accountNumber =
      options.accountNumber ||
      process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;

    this.currency =
      options.currency ||
      "NGN";

    this.tolerance =
      Number(options.tolerance || 0.01);

    this.referenceStore =
      options.referenceStore || null;
  }

  normalizeAmount(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      throw new Error(
        `Invalid monetary amount: ${value}`
      );
    }

    return amount;
  }

  amountsMatch(expected, actual) {
    return (
      Math.abs(
        this.normalizeAmount(expected) -
          this.normalizeAmount(actual)
      ) <= this.tolerance
    );
  }

  buildExpectedFunding({
    reference,
    amount,
    currency = this.currency
  }) {
    if (!reference) {
      throw new Error(
        "Funding reference is required"
      );
    }

    const numericAmount =
      this.normalizeAmount(amount);

    if (numericAmount <= 0) {
      throw new Error(
        "Funding amount must be greater than zero"
      );
    }

    return {
      reference,
      amount: numericAmount,
      currency,
      destination:
        "MONNIFY_WALLET",
      accountNumber:
        this.accountNumber,
      expectedStatus:
        "PENDING",
      createdAt:
        new Date().toISOString()
    };
  }

  reconcileWebhookActivity({
    expected,
    activity
  }) {
    if (!expected) {
      throw new Error(
        "Expected funding record is required"
      );
    }

    if (!activity) {
      throw new Error(
        "Monnify activity is required"
      );
    }

    const referenceMatches =
      !expected.reference ||
      !activity.reference ||
      expected.reference ===
        activity.reference;

    const amountMatches =
      this.amountsMatch(
        expected.amount,
        activity.amount
      );

    const currencyMatches =
      String(
        expected.currency || this.currency
      ).toUpperCase() ===
      String(
        activity.currency || this.currency
      ).toUpperCase();

    const credit =
      String(
        activity.activityType || ""
      ).toUpperCase().includes("CREDIT");

    if (
      referenceMatches &&
      amountMatches &&
      currencyMatches &&
      credit
    ) {
      return {
        reconciled: true,

        status: "CONFIRMED",

        reference:
          expected.reference,

        amount:
          expected.amount,

        currency:
          expected.currency,

        providerReference:
          activity.reference,

        providerBalanceAfter:
          activity.balanceAfter,

        reconciledAt:
          new Date().toISOString()
      };
    }

    return {
      reconciled: false,

      status: "REQUIRES_REVIEW",

      reference:
        expected.reference,

      expected: {
        amount:
          expected.amount,
        currency:
          expected.currency,
        reference:
          expected.reference
      },

      provider: {
        amount:
          activity.amount,
        currency:
          activity.currency,
        reference:
          activity.reference,
        activityType:
          activity.activityType,
        balanceAfter:
          activity.balanceAfter
      },

      reasons: [
        !referenceMatches
          ? "REFERENCE_MISMATCH"
          : null,

        !amountMatches
          ? "AMOUNT_MISMATCH"
          : null,

        !currencyMatches
          ? "CURRENCY_MISMATCH"
          : null,

        !credit
          ? "ACTIVITY_IS_NOT_CREDIT"
          : null
      ].filter(Boolean),

      checkedAt:
        new Date().toISOString()
    };
  }

  async reconcileBalance(expectedBalance) {
    const providerBalance =
      await this.wallet.getBalance();

    const expected =
      this.normalizeAmount(
        expectedBalance
      );

    const available =
      this.normalizeAmount(
        providerBalance.availableBalance
      );

    const ledger =
      this.normalizeAmount(
        providerBalance.ledgerBalance
      );

    return {
      reconciled:
        this.amountsMatch(
          expected,
          available
        ),

      expectedAvailableBalance:
        expected,

      providerAvailableBalance:
        available,

      providerLedgerBalance:
        ledger,

      difference:
        available - expected,

      accountNumber:
        providerBalance.accountNumber,

      currency:
        providerBalance.currency,

      checkedAt:
        new Date().toISOString()
    };
  }

  async verifyWalletState() {
    const balance =
      await this.wallet.getBalance();

    const available =
      this.normalizeAmount(
        balance.availableBalance
      );

    const ledger =
      this.normalizeAmount(
        balance.ledgerBalance
      );

    return {
      healthy:
        available <= ledger,

      accountNumber:
        balance.accountNumber,

      currency:
        balance.currency,

      availableBalance:
        available,

      ledgerBalance:
        ledger,

      difference:
        ledger - available,

      checkedAt:
        new Date().toISOString()
    };
  }

  async reconcileFunding({
    expectedFunding,
    providerActivity
  }) {
    if (
      !expectedFunding ||
      !providerActivity
    ) {
      throw new Error(
        "expectedFunding and providerActivity are required"
      );
    }

    const result =
      this.reconcileWebhookActivity({
        expected:
          expectedFunding,
        activity:
          providerActivity
      });

    /*
     * Never silently turn a mismatch into CONFIRMED.
     */
    if (!result.reconciled) {
      return {
        ...result,
        action:
          "HOLD_AND_REVIEW"
      };
    }

    return {
      ...result,
      action:
        "MARK_PROVIDER_CONFIRMED"
    };
  }
}

module.exports =
  MonnifyWalletReconciliation;
