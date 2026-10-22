'use strict';

const Authorization = require('./Authorization');

const TransactionAuth = require('./TransactionAuth');

const RateLimiterModule = require('./RateLimiter');

const SecurityAuditModule = require('./SecurityAudit');

module.exports = {
    // Authentication and authorization rules.
    ROLES: Authorization.ROLES,
    PERMISSIONS: Authorization.PERMISSIONS,
    ROLE_PERMISSIONS: Authorization.ROLE_PERMISSIONS,

    AuthorizationError: Authorization.AuthorizationError,

    hasPermission: Authorization.hasPermission,
    requirePermission: Authorization.requirePermission,
    requireUserIdentity: Authorization.requireUserIdentity,
    requireOwnership: Authorization.requireOwnership,
    authorize: Authorization.authorize,

    // Transaction security.
    TransactionAuth,

    // Rate limiting.
    RateLimiter: RateLimiterModule.RateLimiter,
    RateLimitError: RateLimiterModule.RateLimitError,

    // Security auditing.
    SecurityAudit: SecurityAuditModule.SecurityAudit,
    ALLOWED_EVENT_TYPES: SecurityAuditModule.ALLOWED_EVENT_TYPES,
    sanitizeMetadata: SecurityAuditModule.sanitizeMetadata
};
