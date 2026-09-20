import React, { useCallback, useState } from "react";
import Rates from "./Rates";
import Swap from "./Swap";
import TransactionFees from "./TransactionFees";

const DEFAULT_FEE_RATE = 0;

export default function ExchangeEngine({
  skdBalance = 0,
  usdtBalance = 0,
  skdToUsdtRate = 0,
  feeRate = DEFAULT_FEE_RATE,
  onSwap,
}) {
  const [direction, setDirection] = useState("SKD_TO_USDT");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const safeSkdBalance = Number.isFinite(Number(skdBalance))
    ? Number(skdBalance)
    : 0;

  const safeUsdtBalance = Number.isFinite(Number(usdtBalance))
    ? Number(usdtBalance)
    : 0;

  const safeRate = Number.isFinite(Number(skdToUsdtRate))
    ? Number(skdToUsdtRate)
    : 0;

  const safeFeeRate = Number.isFinite(Number(feeRate))
    ? Math.max(0, Number(feeRate))
    : DEFAULT_FEE_RATE;

  const calculateQuote = useCallback(() => {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0 || safeRate <= 0) {
      return {
        input: 0,
        grossOutput: 0,
        fee: 0,
        netOutput: 0,
      };
    }

    if (direction === "SKD_TO_USDT") {
      const grossOutput = value * safeRate;
      const fee = grossOutput * safeFeeRate;
      const netOutput = grossOutput - fee;

      return {
        input: value,
        grossOutput,
        fee,
        netOutput,
      };
    }

    const grossOutput = value / safeRate;
    const fee = grossOutput * safeFeeRate;
    const netOutput = grossOutput - fee;

    return {
      input: value,
      grossOutput,
      fee,
      netOutput,
    };
  }, [amount, direction, safeRate, safeFeeRate]);

  const quote = calculateQuote();

  const handleSwap = async () => {
    setStatus("");

    if (quote.input <= 0) {
      setStatus("Enter a valid amount.");
      return;
    }

    if (safeRate <= 0) {
      setStatus("Exchange rate is currently unavailable.");
      return;
    }

    if (direction === "SKD_TO_USDT" && quote.input > safeSkdBalance) {
      setStatus("Insufficient SKD balance.");
      return;
    }

    if (direction === "USDT_TO_SKD" && quote.input > safeUsdtBalance) {
      setStatus("Insufficient USDT balance.");
      return;
    }

    try {
      if (typeof onSwap === "function") {
        await onSwap({
          direction,
          amount: quote.input,
          grossOutput: quote.grossOutput,
          fee: quote.fee,
          netOutput: quote.netOutput,
        });
      }

      setStatus("Swap submitted successfully.");
      setAmount("");
    } catch (error) {
      setStatus(
        error?.message || "The swap could not be completed."
      );
    }
  };

  const toggleDirection = () => {
    setDirection((current) =>
      current === "SKD_TO_USDT"
        ? "USDT_TO_SKD"
        : "SKD_TO_USDT"
    );

    setAmount("");
    setStatus("");
  };

  return (
    <section className="exchange-engine">
      <header className="exchange-engine__header">
        <h1>SkyDrop Exchange</h1>
        <p>Exchange SKD and USDT using the current available rate.</p>
      </header>

      <Rates
        skdToUsdtRate={safeRate}
        skdBalance={safeSkdBalance}
        usdtBalance={safeUsdtBalance}
      />

      <Swap
        direction={direction}
        amount={amount}
        quote={quote}
        skdBalance={safeSkdBalance}
        usdtBalance={safeUsdtBalance}
        onAmountChange={setAmount}
        onToggleDirection={toggleDirection}
        onSwap={handleSwap}
      />

      <TransactionFees
        feeRate={safeFeeRate}
        feeAmount={quote.fee}
        outputAmount={quote.netOutput}
        outputCurrency={
          direction === "SKD_TO_USDT" ? "USDT" : "SKD"
        }
      />

      {status && (
        <div
          className={`exchange-engine__status ${
            status.includes("successfully")
              ? "exchange-engine__status--success"
              : "exchange-engine__status--error"
          }`}
          role="status"
        >
          {status}
        </div>
      )}
    </section>
  );
    }
