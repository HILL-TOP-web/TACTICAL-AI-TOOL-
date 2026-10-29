'use strict';

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    try {
        const authorization =
            req.get('authorization') || '';

        const [scheme, token] =
            authorization.split(' ');

        if (
            scheme !== 'Bearer' ||
            !token
        ) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                success: false,
                error: 'Authentication is not configured.'
            });
        }

        const payload = jwt.verify(
            token,
            secret,
            {
                algorithms: ['HS256']
            }
        );

        const userId = payload.sub;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication token.'
            });
        }

        req.user = {
            id: userId
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired authentication token.'
        });
    }
}

module.exports = requireAuth;
