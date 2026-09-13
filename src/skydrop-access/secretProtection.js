function getPasswordHash() {
  const value =
    process.env.SKYDROP_ACCESS_PASSWORD_HASH;

  if (!value) {
    return null;
  }

  return value.trim();
}

function isConfigured() {
  return Boolean(getPasswordHash());
}

function getPublicStatus() {
  return {
    configured: isConfigured()
  };
}

module.exports = {
  getPasswordHash,
  isConfigured,
  getPublicStatus
};
