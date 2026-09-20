import React, { useEffect, useMemo, useState } from "react";
import MiningSession from "./MiningSession";
import Rewards from "./Rewards";

const DEFAULT_MINING_RATE = 0.00001;
const DEFAULT_INTERVAL_SECONDS = 300; // 5 minutes

export default function MiningEngine({
  initialBalance = 0,
  miningRate = DEFAULT_MINING_RATE,
  intervalSeconds = DEFAULT_INTERVAL_SECONDS,
  autoStart = false,
  onBalanceChange,
}) {
  const [balance, setBalance] = useState(Number(initialBalance) || 0);
  const [isMining, setIsMining] = useState(autoStart);
  const [totalMined, setTotalMined] = useState(0);
  const [lastReward, setLastReward] = useState(0);

  const safeRate = useMemo(() => {
    const value = Number(miningRate);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_MINING_RATE;
  }, [miningRate]);

  const safeInterval = useMemo(() => {
    const value = Number(intervalSeconds);
    return Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_INTERVAL_SECONDS;
  }, [intervalSeconds]);

  useEffect(() => {
    if (!isMining) return undefined;

    const timer = setInterval(() => {
      setBalance((currentBalance) => {
        const newBalance = currentBalance + safeRate;

        setTotalMined((currentTotal) => currentTotal + safeRate);
        setLastReward(safeRate);

        if (typeof onBalanceChange === "function") {
          onBalanceChange(newBalance);
        }

        return newBalance;
      });
    }, safeInterval * 1000);

    return () => clearInterval(timer);
  }, [isMining, safeRate, safeInterval, onBalanceChange]);

  const startMining = () => {
    setIsMining(true);
  };

  const stopMining = () => {
    setIsMining(false);
  };

  const resetMining = () => {
    setIsMining(false);
    setBalance(Number(initialBalance) || 0);
    setTotalMined(0);
    setLastReward(0);
  };

  return (
    <section className="mining-engine">
      <div className="mining-engine__header">
        <h1>SkyDrop Mining</h1>
        <p>Mine SKD rewards through your active mining session.</p>
      </div>

      <MiningSession
        balance={balance}
        isMining={isMining}
        miningRate={safeRate}
        intervalSeconds={safeInterval}
        onStart={startMining}
        onStop={stopMining}
        onReset={resetMining}
      />

      <Rewards
        balance={balance}
        totalMined={totalMined}
        lastReward={lastReward}
        miningRate={safeRate}
        intervalSeconds={safeInterval}
      />
    </section>
  );
    }
