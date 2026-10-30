'use strict';

const jwt = require('jsonwebtoken');

const User = require('../models/User');
const SessionService = require('../authentication/SessionService');

async function requireAuth(req, res, next) {

    try {

        const authorization = req.headers.authorization;

        if (!authorization ||
            !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ['HS256']
            }
        );

        if (!decoded.userId || !decoded.sessionId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication claims.'
            });
        }

        const session = await SessionService.validateSession(
            token
        );

        if (!session ||
            String(session._id) !== String(decoded.sessionId) ||
            String(session.userId) !== String(decoded.userId)) {
            return res.status(401).json({
                success: false,
                message: 'Session expired or invalid.'
            });
        }

        const user = await User.findById(decoded.userId)
            .select('-password -passwordHash');

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'Account unavailable.'
            });
        }

        req.user = user;
        req.auth = {
            userId: user._id,
            sessionId: session._id
        };

        next();

    } catch (error) {

        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        next(error);
    }
}

module.exports = requireAuth;
