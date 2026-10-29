'use strict';

const TokenService = require('./TokenService');
const AuthRepository = require('./AuthRepository');

function extractBearerToken(req) {
    const authorization = req.headers.authorization;

    if (typeof authorization !== 'string') {
        return null;
    }

    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    return match ? match[1] : null;
}

async function requireAuth(req, res, next) {
    try {
        const token = extractBearerToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const payload = TokenService.verifyAccessToken(token);

        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access token.'
            });
        }

        const user = await AuthRepository.findById(payload.sub);

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                error: 'User account not found or inactive.'
            });
        }

        req.user = {
            id: String(user._id),
            email: user.email,
            role: user.role
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired access token.'
        });
    }
}

function requireRole(...allowedRoles) {
    return function roleMiddleware(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to perform this action.'
            });
        }

        return next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};
