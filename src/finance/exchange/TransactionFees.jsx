import React from "react";

export default function TransactionFees({
  feeRate = 0,
  feeAmount = 0,
  outputAmount = 0,
  outputCurrency = "USDT",
}) {
  const safeFeeRate = Number.isFinite(Number(feeRate))
    ? Math.max(0, Number(feeRate))
    : 0;

  const safeFeeAmount = Number.isFinite(Number(feeAmount))
    ? Math.max(0, Number(feeAmount))
    : 0;

  const safeOutputAmount = Number.isFinite(Number(outputAmount))
    ? Math.max(0, Number(outputAmount))
    : 0;

  const formatAmount = (value) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(4)}%`;
  };

  return (
    <section className="transaction-fees">
      <div className="transaction-fees__header">
        <h2>Transaction Fees</h2>
        <span>Exchange fee information</span>
      </div>

      <div className="transaction-fees__content">
        <div className="transaction-fees__row">
          <span>Fee rate</span>
          <strong>{formatPercentage(safeFeeRate)}</strong>
        </div>

        <div className="transaction-fees__row">
          <span>Estimated fee</span>
          <strong>
            {formatAmount(safeFeeAmount)} {outputCurrency}
          </strong>
        </div>

        <div className="transaction-fees__divider" />

        <div className="transaction-fees__row transaction-fees__row--total">
          <span>Estimated received</span>
          <strong>
            {formatAmount(safeOutputAmount)} {outputCurrency}
          </strong>
        </div>
      </div>

      <div className="transaction-fees__notice">
        The final fee should be calculated and validated by the SkyDrop
        backend before a transaction is executed.
      </div>
    </section>
  );
}
