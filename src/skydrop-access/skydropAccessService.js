const passwordVerifier = require("./passwordVerifier");
const accessSession = require("./accessSession");
const accessRateLimiter = require("./accessRateLimiter");
const accessAuditLogger = require("./accessAuditLogger");
const accessPolicy = require("./accessPolicy");
const secretProtection = require("./secretProtection");

async function authenticate({
  password,
  ip,
  userAgent,
  sessionId
}) {
  const policy = accessPolicy.getPolicy();

  if (!policy.enabled) {
    accessAuditLogger.log("access_bypass", {
      ip,
      userAgent
    });

    return {
      success: true,
      message: "SkyDrop access control is disabled."
    };
  }

  const rateCheck = accessRateLimiter.check(ip);

  if (!rateCheck.allowed) {
    accessAuditLogger.log("rate_limited", {
      ip,
      userAgent
    });

    return {
      success: false,
      statusCode: 429,
      message: "Too many access attempts. Try again later."
    };
  }

  if (!password || typeof password !== "string") {
    accessRateLimiter.recordFailure(ip);

    return {
      success: false,
      statusCode: 400,
      message: "Password is required."
    };
  }

  if (!secretProtection.isConfigured()) {
    accessAuditLogger.log("configuration_error", {
      ip,
      userAgent
    });

    return {
      success: false,
      statusCode: 503,
      message: "SkyDrop access is not configured."
    };
  }

  const valid = await passwordVerifier.verify(password);

  if (!valid) {
    accessRateLimiter.recordFailure(ip);

    accessAuditLogger.log("access_denied", {
      ip,
      userAgent
    });

    return {
      success: false,
      statusCode: 401,
      message: "Access denied."
    };
  }

  accessRateLimiter.recordSuccess(ip);

  const session = accessSession.create({
    sessionId,
    ip,
    userAgent
  });

  accessAuditLogger.log("access_granted", {
    ip,
    userAgent
  });

  return {
    success: true,
    message: "Access granted.",
    session
  };
}

function checkSession({ sessionId }) {
  const valid = accessSession.isValid(sessionId);

  if (!valid) {
    return {
      success: false,
      message: "SkyDrop access session is invalid or expired."
    };
  }

  return {
    success: true,
    message: "SkyDrop access session is active."
  };
}

function revokeSession(sessionId) {
  accessSession.revoke(sessionId);

  return {
    success: true,
    message: "SkyDrop access session revoked."
  };
}

module.exports = {
  authenticate,
  checkSession,
  revokeSession
};
