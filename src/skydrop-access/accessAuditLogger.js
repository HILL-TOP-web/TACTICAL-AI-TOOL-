function sanitize(metadata = {}) {
  const safe = { ...metadata };

  delete safe.password;
  delete safe.secret;
  delete safe.token;
  delete safe.accessToken;

  return safe;
}

function log(event, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    service: "skydrop-access",
    event,
    metadata: sanitize(metadata)
  };

  console.log(
    JSON.stringify(entry)
  );
}

module.exports = {
  log
};
