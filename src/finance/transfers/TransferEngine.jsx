import React, { useMemo, useState } from "react";
import TransactionHistory from "./TransactionHistory";

const SUPPORTED_ASSETS = ["SKD", "USDT"];

export default function TransferEngine({
  balances = {
    SKD: 0,
    USDT: 0,
  },
  currentUser = null,
  onTransfer,
  transactions = [],
}) {
  const [asset, setAsset] = useState("SKD");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);

  const balance = useMemo(() => {
    const value = Number(balances?.[asset]);

    return Number.isFinite(value) ? value : 0;
  }, [balances, asset]);

  const formatAmount = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0.00000000";
    }

    return number.toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  };

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMax = () => {
    setAmount(String(balance));
  };

  const handleTransfer = async (event) => {
    event.preventDefault();

    setStatus("");

    const numericAmount = Number(amount);

    if (!recipient.trim()) {
      setStatus("Enter the recipient.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatus("Enter a valid transfer amount.");
      return;
    }

    if (numericAmount > balance) {
      setStatus(`Insufficient ${asset} balance.`);
      return;
    }

    if (typeof onTransfer !== "function") {
      setStatus(
        "Transfer service is not connected yet."
      );
      return;
    }

    setProcessing(true);

    try {
      await onTransfer({
        asset,
        recipient: recipient.trim(),
        amount: numericAmount,
        memo: memo.trim(),
      });

      setStatus("Transfer submitted successfully.");
      setRecipient("");
      setAmount("");
      setMemo("");
    } catch (error) {
      setStatus(
        error?.message || "Transfer could not be completed."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="transfer-engine">
      <header className="transfer-engine__header">
        <h1>SkyDrop Transfers</h1>
        <p>
          Send supported assets to another SkyDrop user or supported
          destination.
        </p>
      </header>

      <form
        className="transfer-engine__form"
        onSubmit={handleTransfer}
      >
        <div className="transfer-engine__field">
          <label htmlFor="transfer-asset">
            Asset
          </label>

          <select
            id="transfer-asset"
            value={asset}
            onChange={(event) => {
              setAsset(event.target.value);
              setAmount("");
              setStatus("");
            }}
          >
            {SUPPORTED_ASSETS.map((supportedAsset) => (
              <option
                key={supportedAsset}
                value={supportedAsset}
              >
                {supportedAsset}
              </option>
            ))}
          </select>
        </div>

        <div className="transfer-engine__balance">
          Available balance:
          <strong>
            {formatAmount(balance)} {asset}
          </strong>
        </div>

        <div className="transfer-engine__field">
          <label htmlFor="transfer-recipient">
            Recipient
          </label>

          <input
            id="transfer-recipient"
            type="text"
            value={recipient}
            onChange={(event) =>
              setRecipient(event.target.value)
            }
            placeholder="Username or wallet address"
            autoComplete="off"
          />
        </div>

        <div className="transfer-engine__field">
          <label htmlFor="transfer-amount">
            Amount
          </label>

          <div className="transfer-engine__amount">
            <input
              id="transfer-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
            />

            <button
              type="button"
              onClick={handleMax}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="transfer-engine__field">
          <label htmlFor="transfer-memo">
            Memo
          </label>

          <textarea
            id="transfer-memo"
            value={memo}
            onChange={(event) =>
              setMemo(event.target.value)
            }
            placeholder="Optional transfer note"
            maxLength={250}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={processing}
          className="transfer-engine__submit"
        >
          {processing
            ? "Processing..."
            : `Send ${asset}`}
        </button>

        {status && (
          <div
            className="transfer-engine__status"
            role="status"
          >
            {status}
          </div>
        )}
      </form>

      <TransactionHistory transactions={transactions} />

      {currentUser && (
        <div className="transfer-engine__user">
          Signed in as{" "}
          <strong>
            {currentUser.username ||
              currentUser.email ||
              "SkyDrop user"}
          </strong>
        </div>
      )}
    </section>
  );
      }
