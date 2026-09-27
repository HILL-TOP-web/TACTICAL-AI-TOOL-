// src/finance/withdrawals/WithdrawalEngine.js

const crypto = require("crypto");

const WalletManager = require("../wallet/WalletManager");
const BankAccounts = require("../banking/BankAccounts");
const PayoutProvider = require("../banking/PayoutProvider");
const PayoutStatus = require("../banking/PayoutStatus");
const TransactionAuth = require("../security/TransactionAuth");
const Limits = require("../security/Limits");
const Audit = require("../security/Audit");

class WithdrawalEngine {
  async withdraw({
    userId,
    accountId,
    amount,
    currency = "NGN",
    authorizationToken
  }) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!accountId) {
      throw new Error("Bank account is required");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "Withdrawal amount must be greater than zero"
      );
    }

    /*
     * Transaction authorization.
     */
    if (
      !TransactionAuth.verifyToken(
        userId,
        authorizationToken
      )
    ) {
      throw new Error(
        "Transaction authorization failed"
      );
    }

    const account =
      BankAccounts.getAccount(
        userId,
        accountId
      );

    if (!account) {
      throw new Error(
        "Bank account not found"
      );
    }

    if (!account.verified) {
      throw new Error(
        "Bank account has not been verified"
      );
    }

    /*
     * Apply transaction limits.
     */
    Limits.validate(
      userId,
      currency,
      amount
    );

    const reference =
      `WD-${crypto.randomUUID()}`;

    /*
     * Reserve the funds by debiting the wallet.
     */
    WalletManager.debit(
      userId,
      currency,
      amount
    );

    try {
      const payout =
        await PayoutProvider.createPayout({
          userId,
          accountNumber:
            account.accountNumber,
          bankCode:
            account.bankCode,
          amount,
          reference
        });

      PayoutStatus.create(
        reference,
        payout.status || "pending"
      );

      Limits.record(
        userId,
        currency,
        amount
      );

      TransactionAuth.consumeToken(
        userId,
        authorizationToken
      );

      Audit.record({
        userId,
        action: "withdrawal_created",
        status: "success",
        metadata: {
          reference,
          currency,
          amount,
          accountId
        }
      });

      return {
        success: true,
        reference,
        status: payout.status || "pending",
        amount,
        currency,
        accountId,
        createdAt:
          new Date().toISOString()
      };
    } catch (error) {
      /*
       * Refund the wallet if payout creation
       * fails before the provider accepts it.
       */
      WalletManager.credit(
        userId,
        currency,
        amount
      );

      Audit.record({
        userId,
        action: "withdrawal_created",
        status: "failed",
        metadata: {
          currency,
          amount,
          accountId,
          error: error.message
        }
      });

      throw error;
    }
  }

  getStatus(reference) {
    return PayoutStatus.get(reference);
  }
}

module.exports = new WithdrawalEngine();
