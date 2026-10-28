'use strict';

const {
    AuthorizationService
} = require('./AuthorizationService');

function createAuthorizationMiddleware(options = {}) {
    const authorizationService =
        options.authorizationService ||
        new AuthorizationService();

    function requireAuthentication(req, res, next) {
        if (!req.user || !req.auth) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication is required.'
                }
            });
        }

        return next();
    }

    function requireRoles(...allowedRoles) {
        return [
            requireAuthentication,
            (req, res, next) => {
                if (
                    !authorizationService.hasRole(
                        req.user,
                        allowedRoles
                    )
                ) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_ROLE',
                            message: 'You do not have permission to access this resource.'
                        }
                    });
                }

                return next();
            }
        ];
    }

    function requirePermission(permission) {
        return [
            requireAuthentication,
            (req, res, next) => {
                if (
                    !authorizationService.hasPermission(
                        req.user,
                        permission
                    )
                ) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSION',
                            message: 'You do not have permission to perform this action.'
                        }
                    });
                }

                return next();
            }
        ];
    }

    function requireSelfOrPermission(
        getTargetUserId,
        permission = 'profile:read:any'
    ) {
        return [
            requireAuthentication,
            async (req, res, next) => {
                try {
                    const targetUserId =
                        await getTargetUserId(req);

                    const isOwner =
                        String(req.auth.userId) ===
                        String(targetUserId);

                    const isPrivileged =
                        authorizationService.hasPermission(
                            req.user,
                            permission
                        );

                    if (!isOwner && !isPrivileged) {
                        return res.status(403).json({
                            success: false,
                            error: {
                                code: 'RESOURCE_ACCESS_DENIED',
                                message: 'You cannot access this resource.'
                            }
                        });
                    }

                    return next();
                } catch (error) {
                    return next(error);
                }
            }
        ];
    }

    return {
        requireAuthentication,
        requireRoles,
        requirePermission,
        requireSelfOrPermission
    };
}

const authorization =
    createAuthorizationMiddleware();

module.exports = {
    createAuthorizationMiddleware,
    requireAuthentication:
        authorization.requireAuthentication,
    requireRoles:
        authorization.requireRoles,
    requirePermission:
        authorization.requirePermission,
    requireSelfOrPermission:
        authorization.requireSelfOrPermission
};
