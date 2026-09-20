import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Withdrawals({ onComplete }) {
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleWithdrawal(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid withdrawal amount."
      );
      return;
    }

    if (!destination.trim()) {
      setError("Enter a destination.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/wallet/withdrawals`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            asset,
            amount: numericAmount,
            destination: destination.trim(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create withdrawal request."
        );
      }

      setMessage(
        data.message ||
          "Withdrawal request submitted successfully."
      );

      setAmount("");
      setDestination("");

      if (typeof onComplete === "function") {
        await onComplete();
      }
    } catch (error) {
      setError(
        error.message ||
          "Withdrawal request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="withdrawal-section">
      <h3>Withdraw</h3>

      <form onSubmit={handleWithdrawal}>
        <div className="form-group">
          <label htmlFor="withdrawal-asset">
            Asset
          </label>

          <select
            id="withdrawal-asset"
            value={asset}
            onChange={(event) =>
              setAsset(event.target.value)
            }
            disabled={loading}
          >
            <option value="USDT">
              USDT
            </option>

            <option value="SKD">
              SKD
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="withdrawal-amount">
            Amount
          </label>

          <input
            id="withdrawal-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            placeholder={`Enter ${asset} amount`}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="withdrawal-destination">
            Destination
          </label>

          <input
            id="withdrawal-destination"
            type="text"
            value={destination}
            onChange={(event) =>
              setDestination(event.target.value)
            }
            placeholder={
              asset === "USDT"
                ? "USDT wallet address"
                : "SkyDrop username or wallet"
            }
            autoComplete="off"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Withdraw"}
        </button>
      </form>

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}
    </section>
  );
  }
