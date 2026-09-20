import React from "react";

export default function PayoutStatus({
  payout = null,
}) {
  if (!payout) {
    return (
      <section className="payout-status">
        <h2>Payout Status</h2>
        <p>No active payout.</p>
      </section>
    );
  }

  const status = String(
    payout.status || "unknown"
  ).toLowerCase();

  const statusLabels = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  const label =
    statusLabels[status] ||
    payout.status ||
    "Unknown";

  const formatAmount = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0.00";
    }

    return number.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  return (
    <section className="payout-status">
      <header className="payout-status__header">
        <h2>Payout Status</h2>

        <span
          className={`payout-status__badge payout-status__badge--${status}`}
        >
          {label}
        </span>
      </header>

      <div className="payout-status__details">
        <div>
          <span>Amount</span>
          <strong>
            {formatAmount(payout.amount)}{" "}
            {payout.currency || "NGN"}
          </strong>
        </div>

        <div>
          <span>Bank</span>
          <strong>
            {payout.bankName || "Not specified"}
          </strong>
        </div>

        <div>
          <span>Reference</span>
          <strong>
            {payout.reference ||
              payout.payoutId ||
              "Pending"}
          </strong>
        </div>

        {payout.createdAt && (
          <div>
            <span>Created</span>
            <strong>
              {new Date(
                payout.createdAt
              ).toLocaleString()}
            </strong>
          </div>
        )}
      </div>

      {payout.message && (
        <div className="payout-status__message">
          {payout.message}
        </div>
      )}
    </section>
  );
}
