'use strict';

class DepositManager {
  constructor({
    balanceManager,
    transactionManager
  }) {
    this.balanceManager =
      balanceManager;

    this.transactionManager =
      transactionManager;
  }

  createDeposit(
    userId,
    asset,
    amount,
    metadata = {}
  ) {
    this.validateDeposit(
      userId,
      asset,
      amount
    );

    /*
     * In this internal wallet implementation,
     * a deposit is credited immediately.
     *
     * For a real blockchain deposit, this method
     * should instead wait for blockchain/network
     * confirmation before crediting the balance.
     */

    const balanceResult =
      this.balanceManager.credit(
        userId,
        asset,
        amount,
        {
          deposit: true,
          ...metadata
        }
      );

    const transaction =
      this.transactionManager.createTransaction({
        userId,
        type: 'deposit',
        asset,
        amount,
        status: 'completed',
        metadata: {
          ...metadata,
          balanceAfter:
            balanceResult.balance
        }
      });

    return {
      success: true,
      transaction,
      balance: balanceResult.balance
    };
  }

  pendingDeposit(
    userId,
    asset,
    amount,
    metadata = {}
  ) {
    this.validateDeposit(
      userId,
      asset,
      amount
    );

    return this.transactionManager
      .createTransaction({
        userId,
        type: 'deposit',
        asset,
        amount,
        status: 'pending',
        metadata
      });
  }

  completeDeposit(
    transactionId
  ) {
    const transaction =
      this.transactionManager
        .getTransaction(transactionId);

    if (transaction.type !== 'deposit') {
      throw new Error(
        'Transaction is not a deposit'
      );
    }

    if (transaction.status !== 'pending') {
      throw new Error(
        'Deposit is not pending'
      );
    }

    const result =
      this.balanceManager.credit(
        transaction.userId,
        transaction.asset,
        transaction.amount,
        {
          depositTransaction:
            transaction.id
        }
      );

    return this.transactionManager
      .updateStatus(
        transaction.id,
        'completed',
        {
          balanceAfter:
            result.balance
        }
      );
  }

  validateDeposit(
    userId,
    asset,
    amount
  ) {
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
        'Deposit asset is required'
      );
    }

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Deposit amount must be greater than zero'
      );
    }
  }
}

module.exports = DepositManager;
