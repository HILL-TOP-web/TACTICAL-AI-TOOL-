import React from "react";

export default function Swap({
  direction = "SKD_TO_USDT",
  amount = "",
  quote = {},
  skdBalance = 0,
  usdtBalance = 0,
  onAmountChange,
  onToggleDirection,
  onSwap,
}) {
  const isSkdToUsdt = direction === "SKD_TO_USDT";

  const inputCurrency = isSkdToUsdt ? "SKD" : "USDT";
  const outputCurrency = isSkdToUsdt ? "USDT" : "SKD";

  const inputBalance = isSkdToUsdt
    ? Number(skdBalance)
    : Number(usdtBalance);

  const grossOutput = Number(quote.grossOutput) || 0;
  const fee = Number(quote.fee) || 0;
  const netOutput = Number(quote.netOutput) || 0;

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "0.00000000";
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  };

  const handleMax = () => {
    const safeBalance = Number.isFinite(inputBalance)
      ? Math.max(0, inputBalance)
      : 0;

    if (typeof onAmountChange === "function") {
      onAmountChange(String(safeBalance));
    }
  };

  const handleInput = (event) => {
    const value = event.target.value;

    if (value === "") {
      onAmountChange("");
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    onAmountChange(value);
  };

  return (
    <section className="swap">
      <div className="swap__header">
        <h2>Swap</h2>

        <button
          type="button"
          onClick={onToggleDirection}
          className="swap__direction-button"
          aria-label="Switch exchange direction"
        >
          ⇅
        </button>
      </div>

      <div className="swap__box">
        <div className="swap__currency-row">
          <div>
            <span>You pay</span>
            <strong>{inputCurrency}</strong>
          </div>

          <div className="swap__balance">
            Balance: {formatNumber(inputBalance)}
          </div>
        </div>

        <div className="swap__input-row">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleInput}
            placeholder="0.00"
            aria-label={`Amount of ${inputCurrency}`}
          />

          <button
            type="button"
            onClick={handleMax}
            className="swap__max-button"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="swap__arrow">↓</div>

      <div className="swap__box">
        <div className="swap__currency-row">
          <div>
            <span>You receive</span>
            <strong>{outputCurrency}</strong>
          </div>
        </div>

        <div className="swap__output">
          {formatNumber(netOutput)}
        </div>
      </div>

      <div className="swap__summary">
        <div>
          <span>Exchange direction</span>
          <strong>
            {inputCurrency} → {outputCurrency}
          </strong>
        </div>

        <div>
          <span>Before fee</span>
          <strong>
            {formatNumber(grossOutput)} {outputCurrency}
          </strong>
        </div>

        <div>
          <span>Transaction fee</span>
          <strong>
            {formatNumber(fee)} {outputCurrency}
          </strong>
        </div>

        <div>
          <span>You receive</span>
          <strong>
            {formatNumber(netOutput)} {outputCurrency}
          </strong>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwap}
        className="swap__submit"
        disabled={!amount || Number(amount) <= 0}
      >
        Swap {inputCurrency} for {outputCurrency}
      </button>
    </section>
  );
      }
