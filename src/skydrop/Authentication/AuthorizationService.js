'use strict';

const mongoose = require('mongoose');

const {
    UserRepository
} = require('../users/UserRepository');

const ROLE_PERMISSIONS = Object.freeze({
    user: [
        'profile:read:self',
        'profile:update:self',
        'wallet:read:self',
        'transaction:read:self',
        'transfer:create:self',
        'withdrawal:create:self'
    ],

    support: [
        'profile:read:any',
        'transaction:read:any'
    ],

    finance: [
        'transaction:read:any',
        'withdrawal:review',
        'transaction:reconcile'
    ],

    admin: [
        'profile:read:any',
        'profile:update:any',
        'wallet:read:any',
        'transaction:read:any',
        'withdrawal:review',
        'transaction:reconcile',
        'user:suspend',
        'user:activate',
        'session:revoke'
    ]
});

class AuthorizationService {
    constructor(options = {}) {
        this.userRepository =
            options.userRepository || new UserRepository();
    }

    getPermissions(roles = []) {
        const permissions = new Set();

        for (const role of roles) {
            for (const permission of ROLE_PERMISSIONS[role] || []) {
                permissions.add(permission);
            }
        }

        return [...permissions];
    }

    hasRole(user, allowedRoles = []) {
        if (!user || !Array.isArray(allowedRoles)) {
            return false;
        }

        const userRoles = user.roles || [];

        return allowedRoles.some((role) =>
            userRoles.includes(role)
        );
    }

    hasPermission(user, requiredPermission) {
        if (!user || !requiredPermission) {
            return false;
        }

        return this.getPermissions(user.roles || [])
            .includes(requiredPermission);
    }

    async getActiveUser(userId) {
        if (!mongoose.isValidObjectId(userId)) {
            return null;
        }

        const user = await this.userRepository.findById(userId);

        if (!user || user.accountStatus !== 'active') {
            return null;
        }

        return user;
    }

    async canAccessUser(actorId, targetUserId) {
        if (
            !mongoose.isValidObjectId(actorId) ||
            !mongoose.isValidObjectId(targetUserId)
        ) {
            return false;
        }

        if (String(actorId) === String(targetUserId)) {
            return true;
        }

        const actor = await this.getActiveUser(actorId);

        if (!actor) {
            return false;
        }

        return this.hasPermission(
            actor,
            'profile:read:any'
        );
    }

    async canAccessWallet(actorId, wallet) {
        if (!actorId || !wallet || !wallet.userId) {
            return false;
        }

        if (String(actorId) === String(wallet.userId)) {
            return true;
        }

        const actor = await this.getActiveUser(actorId);

        return Boolean(
            actor &&
            this.hasPermission(actor, 'wallet:read:any')
        );
    }

    async canAccessTransaction(actorId, transaction) {
        if (!actorId || !transaction || !transaction.userId) {
            return false;
        }

        if (String(actorId) === String(transaction.userId)) {
            return true;
        }

        const actor = await this.getActiveUser(actorId);

        return Boolean(
            actor &&
            this.hasPermission(actor, 'transaction:read:any')
        );
    }

    async assertPermission(user, permission) {
        if (!this.hasPermission(user, permission)) {
            const error = new Error('Permission denied.');
            error.statusCode = 403;
            error.code = 'FORBIDDEN';

            throw error;
        }

        return true;
    }
}

module.exports = {
    AuthorizationService,
    ROLE_PERMISSIONS
};
