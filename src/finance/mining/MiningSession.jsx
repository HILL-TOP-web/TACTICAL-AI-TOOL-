import React, { useEffect, useState } from "react";

export default function MiningSession({
  balance = 0,
  isMining = false,
  miningRate = 0.00001,
  intervalSeconds = 300,
  onStart,
  onStop,
  onReset,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);

  useEffect(() => {
    if (!isMining) {
      setSecondsRemaining(intervalSeconds);
      return undefined;
    }

    setSecondsRemaining(intervalSeconds);

    const timer = setInterval(() => {
      setSecondsRemaining((seconds) => {
        if (seconds <= 1) {
          return intervalSeconds;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMining, intervalSeconds]);

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    return [hours, minutes, remainingSeconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  return (
    <div className="mining-session">
      <div className="mining-session__status">
        <span
          className={`mining-session__indicator ${
            isMining ? "active" : "inactive"
          }`}
        />

        <span>
          {isMining ? "Mining active" : "Mining stopped"}
        </span>
      </div>

      <div className="mining-session__balance">
        <span className="mining-session__label">SKD Balance</span>

        <strong>
          {Number(balance).toFixed(8)} SKD
        </strong>
      </div>

      <div className="mining-session__details">
        <div>
          <span>Mining Rate</span>
          <strong>{Number(miningRate).toFixed(8)} SKD</strong>
        </div>

        <div>
          <span>Reward Interval</span>
          <strong>{intervalSeconds} seconds</strong>
        </div>

        <div>
          <span>Next Reward</span>
          <strong>
            {isMining ? formatTime(secondsRemaining) : "--:--:--"}
          </strong>
        </div>
      </div>

      <div className="mining-session__actions">
        {!isMining ? (
          <button
            type="button"
            onClick={onStart}
            className="mining-session__button mining-session__button--start"
          >
            Start Mining
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="mining-session__button mining-session__button--stop"
          >
            Stop Mining
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="mining-session__button mining-session__button--reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
