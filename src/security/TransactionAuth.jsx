import React, { useState } from "react";

export default function TransactionAuth({
  required = true,
  method = "PIN",
  onAuthenticate,
  onCancel,
}) {
  const [credential, setCredential] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!credential.trim()) {
      setError(
        `Enter your ${method.toLowerCase()}.`
      );
      return;
    }

    if (typeof onAuthenticate !== "function") {
      setError(
        "Transaction authentication is not configured."
      );
      return;
    }

    setProcessing(true);

    try {
      await onAuthenticate({
        method,
        credential,
      });

      setCredential("");
    } catch (authenticationError) {
      setError(
        authenticationError?.message ||
          "Authentication failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!required) {
    return null;
  }

  return (
    <section className="transaction-auth">
      <header className="transaction-auth__header">
        <h2>Confirm Transaction</h2>
        <p>
          Additional authentication is required before
          this transaction can proceed.
        </p>
      </header>

      <form
        className="transaction-auth__form"
        onSubmit={handleSubmit}
      >
        <label htmlFor="transaction-credential">
          {method}
        </label>

        <input
          id="transaction-credential"
          type={
            method.toUpperCase() === "PIN"
              ? "password"
              : "text"
          }
          inputMode={
            method.toUpperCase() === "PIN"
              ? "numeric"
              : "text"
          }
          value={credential}
          onChange={(event) =>
            setCredential(event.target.value)
          }
          placeholder={`Enter ${method.toLowerCase()}`}
          autoComplete="off"
        />

        <div className="transaction-auth__actions">
          <button
            type="submit"
            disabled={processing}
          >
            {processing
              ? "Verifying..."
              : "Confirm"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </button>
          )}
        </div>

        {error && (
          <div
            className="transaction-auth__error"
            role="alert"
          >
            {error}
          </div>
        )}
      </form>
    </section>
  );
}
