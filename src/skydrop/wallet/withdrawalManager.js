'use strict';

class WithdrawalManager {
  constructor({
    balanceManager,
    transactionManager
  }) {
    this.balanceManager =
      balanceManager;

    this.transactionManager =
      transactionManager;
  }

  createWithdrawal({
    userId,
    asset,
    amount,
    destination,
    metadata = {}
  }) {
    this.validateWithdrawal({
      userId,
      asset,
      amount,
      destination
    });

    const value = Number(amount);

    if (
      !this.balanceManager.hasSufficientBalance(
        userId,
        asset,
        value
      )
    ) {
      throw new Error(
        `Insufficient ${asset} balance`
      );
    }

    /*
     * Reserve the funds immediately by debiting
     * the wallet. The external transfer itself is
     * NOT claimed to be successful here.
     */

    this.balanceManager.debit(
      userId,
      asset,
      value,
      {
        withdrawal: true
      }
    );

    const transaction =
      this.transactionManager
        .createTransaction({
          userId,
          type: 'withdrawal',
          asset,
          amount: value,
          status: 'pending',
          destination,
          metadata
        });

    return {
      success: true,
      transaction
    };
  }

  completeWithdrawal(
    transactionId,
    externalReference = null
  ) {
    const transaction =
      this.transactionManager
        .getTransaction(transactionId);

    if (
      transaction.type !==
      'withdrawal'
    ) {
      throw new Error(
        'Transaction is not a withdrawal'
      );
    }

    if (
      transaction.status !==
      'pending'
    ) {
      throw new Error(
        'Withdrawal is not pending'
      );
    }

    return this.transactionManager
      .updateStatus(
        transactionId,
        'completed',
        {
          externalReference
        }
      );
  }

  failWithdrawal(
    transactionId,
    reason = 'Withdrawal failed'
  ) {
    const transaction =
      this.transactionManager
        .getTransaction(transactionId);

    if (
      transaction.type !==
      'withdrawal'
    ) {
      throw new Error(
        'Transaction is not a withdrawal'
      );
    }

    if (
      transaction.status !==
      'pending'
    ) {
      throw new Error(
        'Withdrawal is not pending'
      );
    }

    /*
     * Return the reserved funds to the wallet
     * when the external withdrawal fails.
     */

    this.balanceManager.credit(
      transaction.userId,
      transaction.asset,
      transaction.amount,
      {
        withdrawalReversal:
          transaction.id
      }
    );

    return this.transactionManager
      .updateStatus(
        transactionId,
        'failed',
        {
          reason,
          reversed: true
        }
      );
  }

  cancelWithdrawal(
    transactionId
  ) {
    return this.failWithdrawal(
      transactionId,
      'Withdrawal cancelled'
    );
  }

  validateWithdrawal({
    userId,
    asset,
    amount,
    destination
  }) {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ''
    ) {
      throw new Error(
        'A valid userId is required'
      );
    }

    if (!asset) {
      throw new Error(
        'Withdrawal asset is required'
      );
    }

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Withdrawal amount must be greater than zero'
      );
    }

    if (
      !destination ||
      String(destination).trim() === ''
    ) {
      throw new Error(
        'Withdrawal destination is required'
      );
    }
  }
}

module.exports = WithdrawalManager;
