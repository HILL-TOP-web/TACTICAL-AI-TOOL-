import React from "react";

export default function Limits({
  limits = {
    daily: 0,
    monthly: 0,
  },
  usage = {
    daily: 0,
    monthly: 0,
  },
  currency = "USDT",
}) {
  const safeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? Math.max(0, number)
      : 0;
  };

  const dailyLimit = safeNumber(limits.daily);
  const monthlyLimit = safeNumber(limits.monthly);

  const dailyUsage = safeNumber(usage.daily);
  const monthlyUsage = safeNumber(usage.monthly);

  const getPercentage = (used, limit) => {
    if (limit <= 0) {
      return 0;
    }

    return Math.min(100, (used / limit) * 100);
  };

  const format = (value) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });

  const dailyPercentage = getPercentage(
    dailyUsage,
    dailyLimit
  );

  const monthlyPercentage = getPercentage(
    monthlyUsage,
    monthlyLimit
  );

  return (
    <section className="transaction-limits">
      <header className="transaction-limits__header">
        <h2>Transaction Limits</h2>
        <p>
          Your current transaction limits and usage.
        </p>
      </header>

      <div className="transaction-limits__item">
        <div className="transaction-limits__top">
          <span>Daily limit</span>

          <strong>
            {format(dailyUsage)} /{" "}
            {format(dailyLimit)} {currency}
          </strong>
        </div>

        <div className="transaction-limits__bar">
          <div
            style={{
              width: `${dailyPercentage}%`,
            }}
          />
        </div>

        <small>
          {dailyPercentage.toFixed(1)}% used
        </small>
      </div>

      <div className="transaction-limits__item">
        <div className="transaction-limits__top">
          <span>Monthly limit</span>

          <strong>
            {format(monthlyUsage)} /{" "}
            {format(monthlyLimit)} {currency}
          </strong>
        </div>

        <div className="transaction-limits__bar">
          <div
            style={{
              width: `${monthlyPercentage}%`,
            }}
          />
        </div>

        <small>
          {monthlyPercentage.toFixed(1)}% used
        </small>
      </div>
    </section>
  );
    }
