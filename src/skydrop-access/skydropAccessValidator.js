function validatePasswordInput(password) {
  if (typeof password !== "string") {
    return {
      valid: false,
      message: "Password must be a string."
    };
  }

  if (password.length === 0) {
    return {
      valid: false,
      message: "Password cannot be empty."
    };
  }

  if (password.length > 1024) {
    return {
      valid: false,
      message: "Password input is too long."
    };
  }

  return {
    valid: true
  };
}

function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    return false;
  }

  return sessionId.length <= 256;
}

function validateRequest(req) {
  const passwordResult = validatePasswordInput(
    req.body?.password
  );

  if (!passwordResult.valid) {
    return passwordResult;
  }

  return {
    valid: true
  };
}

module.exports = {
  validatePasswordInput,
  validateSessionId,
  validateRequest
};
