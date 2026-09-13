const skydropAccessService = require("./skydropAccessService");

async function requestAccess(req, res, next) {
  try {
    const result = await skydropAccessService.authenticate({
      password: req.body?.password,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      sessionId: req.sessionID
    });

    if (!result.success) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "SkyDrop access granted.",
      session: result.session
    });
  } catch (error) {
    next(error);
  }
}

async function checkAccess(req, res, next) {
  try {
    const result = skydropAccessService.checkSession({
      sessionId: req.sessionID
    });

    return res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    next(error);
  }
}

async function revokeAccess(req, res, next) {
  try {
    const result = skydropAccessService.revokeSession(
      req.sessionID
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requestAccess,
  checkAccess,
  revokeAccess
};
