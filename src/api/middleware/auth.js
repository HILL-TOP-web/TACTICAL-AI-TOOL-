module.exports = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      error: "Authorization header required",
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: "Invalid authorization format",
    });
  }

  // Replace this section with your real authentication
  // service/JWT verification.
  req.auth = {
    token,
  };

  next();
};
