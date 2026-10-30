'use strict';

const jwt = require('jsonwebtoken');

const UserRepository = require('../repositories/UserRepository');

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            'JWT_SECRET must be configured with at least 32 characters.'
        );
    }

    return secret;
}

async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication token is missing.'
            });
        }

        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256']
        });

        if (!decoded.sub) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication token.'
            });
        }

        const user = await UserRepository.findPublicById(decoded.sub);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User account not found.'
            });
        }

        req.user = user;
        req.auth = {
            userId: String(user._id),
            role: user.role
        };

        return next();
    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired authentication token.'
            });
        }

        return next(error);
    }
}

function requireRole(...allowedRoles) {
    return function roleMiddleware(req, res, next) {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorised to perform this operation.'
            });
        }

        return next();
    };
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
