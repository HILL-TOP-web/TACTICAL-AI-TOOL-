'use strict';

const {
    AuthenticationService
} = require('./AuthenticationService');

function createAuthenticationController(options = {}) {
    const authenticationService =
        options.authenticationService ||
        new AuthenticationService();

    function getRequestMetadata(req) {
        return {
            userAgent: req.get('user-agent') || null,

            /*
             * Only trust proxy headers after configuring Express
             * with the correct trusted proxy settings.
             */
            ipAddress: req.ip || null
        };
    }

    function getRefreshCredentials(req) {
        const sessionId =
            req.body?.sessionId ||
            req.cookies?.skydropSessionId;

        const refreshToken =
            req.body?.refreshToken ||
            req.cookies?.skydropRefreshToken;

        return {
            sessionId,
            refreshToken
        };
    }

    async function register(req, res, next) {
        try {
            const result =
                await authenticationService.register(
                    req.body,
                    getRequestMetadata(req)
                );

            return res.status(201).json({
                success: true,
                message: 'Registration received. Verify your email to activate your account.',
                data: result
            });
        } catch (error) {
            if (
                /required|valid email|username|full name|password|register with those details/i
                    .test(error.message)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'REGISTRATION_FAILED',
                        message: error.message
                    }
                });
            }

            return next(error);
        }
    }

    async function login(req, res, next) {
        try {
            const result =
                await authenticationService.login(
                    req.body,
                    getRequestMetadata(req)
                );

            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: result
            });
        } catch (error) {
            if (
                /invalid email or password/i.test(error.message)
            ) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password.'
                    }
                });
            }

            if (
                /not active|verification is required/i.test(error.message)
            ) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_NOT_READY',
                        message: error.message
                    }
                });
            }

            return next(error);
        }
    }

    async function refresh(req, res, next) {
        try {
            const credentials = getRefreshCredentials(req);

            if (
                !credentials.sessionId ||
                !credentials.refreshToken
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'REFRESH_CREDENTIALS_REQUIRED',
                        message: 'A session ID and refresh token are required.'
                    }
                });
            }

            const result =
                await authenticationService.refresh(
                    credentials.sessionId,
                    credentials.refreshToken
                );

            return res.status(200).json({
                success: true,
                message: 'Access token refreshed.',
                data: result
            });
        } catch {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'REFRESH_FAILED',
                    message: 'The refresh token is invalid, expired, or already used.'
                }
            });
        }
    }

    async function logout(req, res, next) {
        try {
            const sessionId =
                req.auth?.sessionId ||
                getRefreshCredentials(req).sessionId;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'SESSION_REQUIRED',
                        message: 'A session ID is required.'
                    }
                });
            }

            await authenticationService.logout(sessionId);

            return res.status(200).json({
                success: true,
                message: 'Logout completed.'
            });
        } catch (error) {
            return next(error);
        }
    }

    async function logoutAll(req, res, next) {
        try {
            const userId = req.auth?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication is required.'
                    }
                });
            }

            await authenticationService.logoutAll(userId);

            return res.status(200).json({
                success: true,
                message: 'All sessions have been revoked.'
            });
        } catch (error) {
            return next(error);
        }
    }

    return {
        register,
        login,
        refresh,
        logout,
        logoutAll
    };
}

module.exports = {
    createAuthenticationController
};
