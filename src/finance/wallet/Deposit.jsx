import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Deposits({ onComplete }) {
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDeposit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid deposit amount.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/wallet/deposits`,
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
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create deposit request."
        );
      }

      setMessage(
        data.message ||
          "Deposit request created successfully."
      );

      setAmount("");

      if (typeof onComplete === "function") {
        await onComplete();
      }
    } catch (error) {
      setError(
        error.message ||
          "Deposit request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="deposit-section">
      <h3>Deposit</h3>

      <form onSubmit={handleDeposit}>
        <div className="form-group">
          <label htmlFor="deposit-asset">
            Asset
          </label>

          <select
            id="deposit-asset"
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
          <label htmlFor="deposit-amount">
            Amount
          </label>

          <input
            id="deposit-amount"
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

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Deposit"}
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
