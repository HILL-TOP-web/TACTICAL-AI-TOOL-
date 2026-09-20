import React, { useState } from "react";

export default function PayoutProvider({
  providers = [],
  selectedProvider = "",
  onProviderChange,
  onConnect,
}) {
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  const handleConnect = async () => {
    setMessage("");

    if (!selectedProvider) {
      setMessage("Select a payout provider first.");
      return;
    }

    if (typeof onConnect !== "function") {
      setMessage(
        "Payout provider connection is not configured."
      );
      return;
    }

    setConnecting(true);

    try {
      await onConnect(selectedProvider);
      setMessage("Payout provider connected.");
    } catch (error) {
      setMessage(
        error?.message ||
          "Unable to connect payout provider."
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section className="payout-provider">
      <header className="payout-provider__header">
        <h2>Payout Provider</h2>
        <p>
          Select the service SkyDrop uses to process bank
          payouts.
        </p>
      </header>

      <div className="payout-provider__field">
        <label htmlFor="payout-provider">
          Provider
        </label>

        <select
          id="payout-provider"
          value={selectedProvider}
          onChange={(event) => {
            onProviderChange?.(event.target.value);
            setMessage("");
          }}
        >
          <option value="">
            Select provider
          </option>

          {providers.map((provider) => {
            const value =
              typeof provider === "string"
                ? provider
                : provider.id;

            const label =
              typeof provider === "string"
                ? provider
                : provider.name;

            return (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="payout-provider__button"
      >
        {connecting
          ? "Connecting..."
          : "Connect Provider"}
      </button>

      {message && (
        <div
          className="payout-provider__message"
          role="status"
        >
          {message}
        </div>
      )}
    </section>
  );
}
