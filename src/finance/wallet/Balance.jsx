import React from "react";

function formatBalance(value, decimals = 8) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export default function Balance({ wallet }) {
  if (!wallet) {
    return (
      <section className="wallet-balance">
        <h3>Balance</h3>
        <p>Wallet balance unavailable.</p>
      </section>
    );
  }

  const skdBalance = Number(
    wallet.skdBalance ?? wallet.SKD ?? 0
  );

  const usdtBalance = Number(
    wallet.usdtBalance ?? wallet.USDT ?? 0
  );

  return (
    <section className="wallet-balance">
      <h3>Your Balance</h3>

      <div className="balance-grid">
        <div className="balance-card">
          <span>SKD</span>

          <strong>
            {formatBalance(skdBalance, 8)}
          </strong>

          <small>
            SkyDrop Token
          </small>
        </div>

        <div className="balance-card">
          <span>USDT</span>

          <strong>
            {formatBalance(usdtBalance, 6)}
          </strong>

          <small>
            Tether USD
          </small>
        </div>
      </div>
    </section>
  );
      }
