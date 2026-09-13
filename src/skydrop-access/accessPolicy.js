function getPolicy() {
  return {
    enabled:
      process.env.SKYDROP_ACCESS_ENABLED !== "false",

    sessionRequired: true,

    maxPasswordAttempts:
      Number(process.env.SKYDROP_ACCESS_MAX_ATTEMPTS) ||
      5,

    sessionDurationMs:
      Number(process.env.SKYDROP_ACCESS_SESSION_MS) ||
      30 * 60 * 1000
  };
}

function canAccessSkyDrop() {
  return getPolicy().enabled;
}

module.exports = {
  getPolicy,
  canAccessSkyDrop
};
