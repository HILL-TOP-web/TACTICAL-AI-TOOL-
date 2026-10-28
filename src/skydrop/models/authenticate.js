'use strict';

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization ||
        !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            success: false,
            message: 'Authentication is not configured.'
        });
    }

    try {
        const payload = jwt.verify(token, secret);

        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }

        req.user = {
            id: payload.sub
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
}

module.exports = authenticate;
