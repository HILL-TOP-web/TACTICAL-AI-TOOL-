import React from "react";

export default function Audit({
  events = [],
}) {
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

  return (
    <section className="security-audit">
      <header className="security-audit__header">
        <h2>Security Audit</h2>
        <p>
          Security-related activity recorded for your
          account.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="security-audit__empty">
          No security events available.
        </div>
      ) : (
        <div className="security-audit__list">
          {events.map((event, index) => {
            const id =
              event.id ||
              event.auditId ||
              `audit-${index}`;

            return (
              <article
                key={id}
                className="security-audit__event"
              >
                <div className="security-audit__icon">
                  {event.success === false
                    ? "!"
                    : "✓"}
                </div>

                <div className="security-audit__content">
                  <strong>
                    {event.action ||
                      "Security event"}
                  </strong>

                  <span>
                    {event.description ||
                      "Security activity recorded."}
                  </span>

                  <small>
                    {formatDate(
                      event.createdAt ||
                        event.timestamp
                    )}
                  </small>

                  {event.ipAddress && (
                    <small>
                      IP: {event.ipAddress}
                    </small>
                  )}

                  {event.device && (
                    <small>
                      Device: {event.device}
                    </small>
                  )}
                </div>

                <span
                  className={`security-audit__status ${
                    event.success === false
                      ? "failed"
                      : "success"
                  }`}
                >
                  {event.success === false
                    ? "Failed"
                    : "Success"}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
