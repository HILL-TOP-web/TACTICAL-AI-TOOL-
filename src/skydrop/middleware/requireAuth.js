'use strict';

function requireAuth(req, res, next) {
    const user = req.user;

    const userId = user && (user.id || user._id);

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'authentication-required'
        });
    }

    next();
}

module.exports = {
    requireAuth
};
