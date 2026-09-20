import React from "react";

export default function Rates({
  skdToUsdtRate = 0,
  skdBalance = 0,
  usdtBalance = 0,
}) {
  const rate = Number(skdToUsdtRate);
  const skd = Number(skdBalance);
  const usdt = Number(usdtBalance);

  const validRate = Number.isFinite(rate) && rate > 0;
  const validSkd = Number.isFinite(skd) ? skd : 0;
  const validUsdt = Number.isFinite(usdt) ? usdt : 0;

  const formatRate = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return "Unavailable";
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  };

  const formatBalance = (value) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  return (
    <section className="exchange-rates">
      <div className="exchange-rates__header">
        <h2>Current Rates</h2>

        <span
          className={`exchange-rates__status ${
            validRate ? "available" : "unavailable"
          }`}
        >
          {validRate ? "Rate available" : "Rate unavailable"}
        </span>
      </div>

      <div className="exchange-rates__main-rate">
        <span>SKD / USDT</span>

        <strong>
          {validRate
            ? `${formatRate(rate)} USDT`
            : "Unavailable"}
        </strong>

        <small>
          1 SKD ={" "}
          {validRate
            ? `${formatRate(rate)} USDT`
            : "rate unavailable"}
        </small>
      </div>

      <div className="exchange-rates__balances">
        <div className="exchange-rates__balance">
          <span>SKD Balance</span>
          <strong>{formatBalance(validSkd)} SKD</strong>
        </div>

        <div className="exchange-rates__balance">
          <span>USDT Balance</span>
          <strong>{formatBalance(validUsdt)} USDT</strong>
        </div>
      </div>

      <div className="exchange-rates__notice">
        Exchange rates should be retrieved from the SkyDrop backend or
        approved pricing source in production. They are intentionally not
        hard-coded into this frontend component.
      </div>
    </section>
  );
}
