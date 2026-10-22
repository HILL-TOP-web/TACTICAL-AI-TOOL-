'use strict';

const ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
    SECURITY_ADMIN: 'security_admin',
    SYSTEM: 'system'
});

const PERMISSIONS = Object.freeze({
    WALLET_READ: 'wallet:read',
    WALLET_UPDATE: 'wallet:update',

    TRANSACTION_READ: 'transaction:read',
    TRANSACTION_CREATE: 'transaction:create',

    TRANSFER_CREATE: 'transfer:create',
    WITHDRAWAL_CREATE: 'withdrawal:create',

    EXCHANGE_CREATE: 'exchange:create',

    SECURITY_AUDIT_READ: 'security_audit:read',
    SECURITY_SETTINGS_UPDATE: 'security_settings:update',

    MONNIFY_STATUS_READ: 'monnify:status:read',
    MONNIFY_RECONCILE: 'monnify:reconcile'
});

const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.USER]: Object.freeze([
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.TRANSACTION_READ,
        PERMISSIONS.TRANSACTION_CREATE,
        PERMISSIONS.TRANSFER_CREATE,
        PERMISSIONS.WITHDRAWAL_CREATE,
        PERMISSIONS.EXCHANGE_CREATE
    ]),

    [ROLES.ADMIN]: Object.freeze([
        PERMISSIONS.WALLET_READ,
        PERMISSIONS.TRANSACTION_READ,
        PERMISSIONS.SECURITY_AUDIT_READ,
        PERMISSIONS.MONNIFY_STATUS_READ
    ]),

    [ROLES.SECURITY_ADMIN]: Object.freeze([
        PERMISSIONS.SECURITY_AUDIT_READ,
        PERMISSIONS.SECURITY_SETTINGS_UPDATE
    ]),

    [ROLES.SYSTEM]: Object.freeze([
        PERMISSIONS.TRANSACTION_READ,
        PERMISSIONS.TRANSACTION_CREATE,
        PERMISSIONS.MONNIFY_STATUS_READ,
        PERMISSIONS.MONNIFY_RECONCILE
    ])
});

class AuthorizationError extends Error {
    constructor(message, code = 'FORBIDDEN') {
        super(message);
        this.name = 'AuthorizationError';
        this.code = code;
        this.statusCode = 403;
    }
}

function hasPermission(user, permission) {
    if (!user || !user.id || !permission) {
        return false;
    }

    const roles = Array.isArray(user.roles)
        ? user.roles
        : user.role
            ? [user.role]
            : [];

    const explicitPermissions = Array.isArray(user.permissions)
        ? user.permissions
        : [];

    return roles.some((role) => {
        return (
            ROLE_PERMISSIONS[role] &&
            ROLE_PERMISSIONS[role].includes(permission)
        );
    }) || explicitPermissions.includes(permission);
}

function requirePermission(user, permission) {
    if (!hasPermission(user, permission)) {
        throw new AuthorizationError(
            'You are not authorized to perform this action.'
        );
    }

    return true;
}

function requireUserIdentity(user) {
    if (!user || typeof user.id !== 'string' || !user.id.trim()) {
        throw new AuthorizationError(
            'An authenticated user is required.',
            'AUTHENTICATION_REQUIRED'
        );
    }

    if (user.active === false || user.disabled === true) {
        throw new AuthorizationError(
            'This account is not permitted to perform this action.',
            'ACCOUNT_DISABLED'
        );
    }

    return true;
}

function requireOwnership(user, resource) {
    requireUserIdentity(user);

    if (!resource || typeof resource.userId !== 'string') {
        throw new AuthorizationError(
            'Resource ownership could not be verified.',
            'OWNERSHIP_CHECK_FAILED'
        );
    }

    const roles = Array.isArray(user.roles)
        ? user.roles
        : user.role
            ? [user.role]
            : [];

    const canReadAllTransactions =
        roles.includes(ROLES.ADMIN) ||
        roles.includes(ROLES.SYSTEM);

    if (
        resource.userId !== user.id &&
        !canReadAllTransactions
    ) {
        throw new AuthorizationError(
            'You cannot access another user’s resource.'
        );
    }

    return true;
}

function authorize(user, permission, resource = null) {
    requireUserIdentity(user);
    requirePermission(user, permission);

    if (resource) {
        requireOwnership(user, resource);
    }

    return true;
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    AuthorizationError,
    hasPermission,
    requirePermission,
    requireUserIdentity,
    requireOwnership,
    authorize
};
