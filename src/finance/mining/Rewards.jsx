import React from "react";

export default function Rewards({
  balance = 0,
  totalMined = 0,
  lastReward = 0,
  miningRate = 0.00001,
  intervalSeconds = 300,
}) {
  const formatSKD = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0.00000000";
    }

    return number.toFixed(8);
  };

  const calculateDailyEstimate = () => {
    const interval = Number(intervalSeconds);

    if (!Number.isFinite(interval) || interval <= 0) {
      return 0;
    }

    const rewardsPerDay = 86400 / interval;

    return Number(miningRate) * rewardsPerDay;
  };

  const dailyEstimate = calculateDailyEstimate();

  return (
    <div className="mining-rewards">
      <div className="mining-rewards__header">
        <h2>Mining Rewards</h2>
        <p>Your current SkyDrop mining statistics.</p>
      </div>

      <div className="mining-rewards__grid">
        <div className="mining-rewards__card">
          <span>Current Balance</span>
          <strong>{formatSKD(balance)} SKD</strong>
        </div>

        <div className="mining-rewards__card">
          <span>Total Mined This Session</span>
          <strong>{formatSKD(totalMined)} SKD</strong>
        </div>

        <div className="mining-rewards__card">
          <span>Last Reward</span>
          <strong>{formatSKD(lastReward)} SKD</strong>
        </div>

        <div className="mining-rewards__card">
          <span>Estimated Daily Mining</span>
          <strong>{formatSKD(dailyEstimate)} SKD</strong>
        </div>
      </div>

      <div className="mining-rewards__info">
        <h3>Mining Information</h3>

        <div className="mining-rewards__row">
          <span>Current mining rate</span>
          <strong>{formatSKD(miningRate)} SKD</strong>
        </div>

        <div className="mining-rewards__row">
          <span>Reward interval</span>
          <strong>{intervalSeconds} seconds</strong>
        </div>

        <div className="mining-rewards__row">
          <span>Daily reward cycles</span>
          <strong>
            {Math.floor(86400 / Number(intervalSeconds || 300))}
          </strong>
        </div>
      </div>

      <div className="mining-rewards__notice">
        <strong>SkyDrop Mining</strong>
        <p>
          Mining rewards shown here are frontend session calculations.
          Production balances should be validated and recorded by the
          SkyDrop backend.
        </p>
      </div>
    </div>
  );
}
