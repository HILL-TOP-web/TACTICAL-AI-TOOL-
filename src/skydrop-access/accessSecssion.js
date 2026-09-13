const crypto = require("crypto");

const sessions = new Map();

const SESSION_DURATION =
  Number(process.env.SKYDROP_ACCESS_SESSION_MS) ||
  30 * 60 * 1000;

function create({
  sessionId,
  ip,
  userAgent
}) {
  const token = crypto
    .randomBytes(32)
    .toString("hex");

  const id = sessionId || token;

  const session = {
    id,
    token,
    ip,
    userAgent,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };

  sessions.set(id, session);

  return {
    token,
    expiresAt: session.expiresAt
  };
}

function isValid(sessionId) {
  if (!sessionId) {
    return false;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  if (Date.now() >= session.expiresAt) {
    sessions.delete(sessionId);
    return false;
  }

  return true;
}

function get(sessionId) {
  if (!isValid(sessionId)) {
    return null;
  }

  return sessions.get(sessionId);
}

function revoke(sessionId) {
  sessions.delete(sessionId);
}

function cleanup() {
  const now = Date.now();

  for (const [id, session] of sessions.entries()) {
    if (now >= session.expiresAt) {
      sessions.delete(id);
    }
  }
}

setInterval(cleanup, 60 * 1000).unref();

module.exports = {
  create,
  isValid,
  get,
  revoke
};
