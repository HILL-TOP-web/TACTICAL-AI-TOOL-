import React, { useCallback, useEffect, useState } from "react";
import Balance from "./Balance";
import Deposits from "./Deposits";
import Withdrawals from "./Withdrawals";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function WalletManager() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/wallet`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load wallet."
        );
      }

      setWallet(data.wallet || data);
    } catch (error) {
      setError(
        error.message || "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function handleWalletUpdate() {
    await loadWallet();
  }

  if (loading) {
    return (
      <section className="wallet-manager">
        <h2>Wallet</h2>
        <p>Loading wallet...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="wallet-manager">
        <h2>Wallet</h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={loadWallet}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="wallet-manager">
      <div className="wallet-header">
        <div>
          <h2>Wallet</h2>
          <p>Manage your SkyDrop assets.</p>
        </div>

        <button
          type="button"
          onClick={loadWallet}
        >
          Refresh
        </button>
      </div>

      <Balance wallet={wallet} />

      <div className="wallet-actions">
        <Deposits
          onComplete={handleWalletUpdate}
        />

        <Withdrawals
          onComplete={handleWalletUpdate}
        />
      </div>
    </section>
  );
        }
