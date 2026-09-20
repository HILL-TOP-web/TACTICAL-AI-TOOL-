import React from "react";

export default function TransactionHistory({
  transactions = [],
}) {
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

  const formatDate = (value) => {
    if (!value) {
      return "Unknown date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "")
      .toLowerCase();

    if (normalized === "completed") {
      return "completed";
    }

    if (
      normalized === "failed" ||
      normalized === "rejected"
    ) {
      return "failed";
    }

    if (
      normalized === "pending" ||
      normalized === "processing"
    ) {
      return "pending";
    }

    return "unknown";
  };

  if (!transactions.length) {
    return (
      <section className="transaction-history">
        <div className="transaction-history__header">
          <h2>Transaction History</h2>
        </div>

        <div className="transaction-history__empty">
          <p>No transactions yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="transaction-history">
      <div className="transaction-history__header">
        <h2>Transaction History</h2>
        <span>{transactions.length} transactions</span>
      </div>

      <div className="transaction-history__list">
        {transactions.map((transaction, index) => {
          const id =
            transaction.id ||
            transaction.transactionId ||
            `transaction-${index}`;

          const statusClass = getStatusClass(
            transaction.status
          );

          const type =
            transaction.type ||
            transaction.direction ||
            "Transfer";

          return (
            <article
              key={id}
              className="transaction-history__item"
            >
              <div className="transaction-history__main">
                <strong>
                  {type}
                </strong>

                <span>
                  {transaction.recipient ||
                    transaction.destination ||
                    "Unknown recipient"}
                </span>

                <small>
                  {formatDate(
                    transaction.createdAt ||
                      transaction.timestamp
                  )}
                </small>
              </div>

              <div className="transaction-history__amount">
                <strong>
                  {formatAmount(transaction.amount)}{" "}
                  {transaction.asset || ""}
                </strong>
              </div>

              <span
                className={`transaction-history__status transaction-history__status--${statusClass}`}
              >
                {transaction.status || "Unknown"}
              </span>

              {transaction.transactionId && (
                <div className="transaction-history__id">
                  ID: {transaction.transactionId}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
          }
