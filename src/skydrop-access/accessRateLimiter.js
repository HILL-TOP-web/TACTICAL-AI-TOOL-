const attempts = new Map();

const WINDOW_MS =
  Number(process.env.SKYDROP_ACCESS_RATE_WINDOW_MS) ||
  15 * 60 * 1000;

const MAX_ATTEMPTS =
  Number(process.env.SKYDROP_ACCESS_MAX_ATTEMPTS) ||
  5;

function getRecord(ip) {
  const now = Date.now();

  let record = attempts.get(ip);

  if (!record || now - record.startedAt > WINDOW_MS) {
    record = {
      startedAt: now,
      failures: 0
    };

    attempts.set(ip, record);
  }

  return record;
}

function check(ip) {
  const record = getRecord(ip);

  return {
    allowed: record.failures < MAX_ATTEMPTS,
    remaining: Math.max(
      0,
      MAX_ATTEMPTS - record.failures
    )
  };
}

function recordFailure(ip) {
  const record = getRecord(ip);
  record.failures += 1;
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

function cleanup() {
  const now = Date.now();

  for (const [ip, record] of attempts.entries()) {
    if (now - record.startedAt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
}

setInterval(cleanup, WINDOW_MS).unref();

module.exports = {
  check,
  recordFailure,
  recordSuccess
};
