/**
 * Tactical AI - Time Utilities
 *
 * Centralized time and duration helpers for:
 * simulations, events, logging,
 * scheduling and training exercises.
 */

function now() {
  return new Date();
}

function nowISO() {
  return new Date().toISOString();
}

function timestamp() {
  return Date.now();
}

function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `Invalid date value: ${value}`
    );
  }

  return date;
}

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function millisecondsToSeconds(milliseconds) {
  return milliseconds / 1000;
}

function minutesToMilliseconds(minutes) {
  return minutes * 60 * 1000;
}

function hoursToMilliseconds(hours) {
  return hours * 60 * 60 * 1000;
}

function daysToMilliseconds(days) {
  return days * 24 * 60 * 60 * 1000;
}

function secondsToMinutes(seconds) {
  return seconds / 60;
}

function minutesToSeconds(minutes) {
  return minutes * 60;
}

function hoursToSeconds(hours) {
  return hours * 60 * 60;
}

function durationBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);

  return endDate.getTime() - startDate.getTime();
}

function elapsedMilliseconds(start) {
  return Date.now() - toDate(start).getTime();
}

function elapsedSeconds(start) {
  return millisecondsToSeconds(
    elapsedMilliseconds(start)
  );
}

function hasElapsed(start, durationMs) {
  return elapsedMilliseconds(start) >= durationMs;
}

function addMilliseconds(date, milliseconds) {
  return new Date(
    toDate(date).getTime() + milliseconds
  );
}

function addSeconds(date, seconds) {
  return addMilliseconds(
    date,
    secondsToMilliseconds(seconds)
  );
}

function addMinutes(date, minutes) {
  return addMilliseconds(
    date,
    minutesToMilliseconds(minutes)
  );
}

function addHours(date, hours) {
  return addMilliseconds(
    date,
    hoursToMilliseconds(hours)
  );
}

function addDays(date, days) {
  return addMilliseconds(
    date,
    daysToMilliseconds(days)
  );
}

function formatDuration(milliseconds) {
  let remaining = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const days = Math.floor(
    remaining / 86400
  );

  remaining %= 86400;

  const hours = Math.floor(
    remaining / 3600
  );

  remaining %= 3600;

  const minutes = Math.floor(
    remaining / 60
  );

  const seconds = remaining % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

function formatClock(milliseconds) {
  let seconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(
    seconds / 3600
  );

  seconds %= 3600;

  const minutes = Math.floor(
    seconds / 60
  );

  seconds %= 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");
}

function sleep(milliseconds) {
  return new Promise(resolve =>
    setTimeout(resolve, milliseconds)
  );
}

function createTimer() {
  const startedAt = Date.now();

  return {
    startedAt,

    elapsed() {
      return Date.now() - startedAt;
    },

    elapsedSeconds() {
      return millisecondsToSeconds(
        this.elapsed()
      );
    },

    elapsedFormatted() {
      return formatDuration(
        this.elapsed()
      );
    },

    reset() {
      return Date.now();
    }
  };
}

function isPast(date) {
  return toDate(date).getTime() < Date.now();
}

function isFuture(date) {
  return toDate(date).getTime() > Date.now();
}

function isBetween(date, start, end) {
  const value = toDate(date).getTime();
  const startValue = toDate(start).getTime();
  const endValue = toDate(end).getTime();

  return (
    value >= startValue &&
    value <= endValue
  );
}

module.exports = {
  now,
  nowISO,
  timestamp,
  toDate,

  secondsToMilliseconds,
  millisecondsToSeconds,
  minutesToMilliseconds,
  hoursToMilliseconds,
  daysToMilliseconds,

  secondsToMinutes,
  minutesToSeconds,
  hoursToSeconds,

  durationBetween,
  elapsedMilliseconds,
  elapsedSeconds,
  hasElapsed,

  addMilliseconds,
  addSeconds,
  addMinutes,
  addHours,
  addDays,

  formatDuration,
  formatClock,

  sleep,
  createTimer,

  isPast,
  isFuture,
  isBetween
};
