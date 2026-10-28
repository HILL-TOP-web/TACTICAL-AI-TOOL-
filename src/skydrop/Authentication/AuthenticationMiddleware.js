'use strict';

const mongoose = require('mongoose');

const {
    AuthenticationService
} = require('./AuthenticationService');

const {
    SessionRepository
} = require('./SessionRepository');

const {
    UserRepository
} = require('../users/UserRepository');

function createAuthenticationMiddleware(options = {}) {
    const authenticationService =
        options.authenticationService ||
        new AuthenticationService();

    const sessionRepository =
        options.sessionRepository ||
        new SessionRepository();

    const userRepository =
        options.userRepository ||
        new UserRepository();

    return async function authenticate(req, res, next) {
        try {
            const authorization =
                req.headers.authorization;

            if (
                typeof authorization !== 'string' ||
                !authorization.startsWith('Bearer ')
            ) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication is required.'
                    }
                });
            }

            const token = authorization.slice(7).trim();

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'A valid access token is required.'
                    }
                });
            }

            let payload;

            try {
                payload =
                    authenticationService.verifyAccessToken(token);
            } catch {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_OR_EXPIRED_TOKEN',
                        message: 'The access token is invalid or expired.'
                    }
                });
            }

            if (
                !mongoose.isValidObjectId(payload.sub) ||
                !mongoose.isValidObjectId(payload.sid)
            ) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN_CLAIMS',
                        message: 'The access token is invalid.'
                    }
                });
            }

            const session =
                await sessionRepository.findActiveById(
                    payload.sid
                );

            if (
                !session ||
                String(session.userId) !== String(payload.sub)
            ) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'SESSION_INVALID',
                        message: 'The session is invalid or expired.'
                    }
                });
            }

            const user = await userRepository.findById(
                payload.sub
            );

            if (
                !user ||
                user.accountStatus !== 'active' ||
                !user.emailVerified
            ) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_INACTIVE',
                        message: 'The account is not authorized to access this resource.'
                    }
                });
            }

            req.auth = {
                userId: user._id.toString(),
                sessionId: session._id.toString(),
                roles: user.roles || [],
                permissions: []
            };

            req.user = user;

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

const authenticate = createAuthenticationMiddleware();

module.exports = {
    authenticate,
    createAuthenticationMiddleware
};
