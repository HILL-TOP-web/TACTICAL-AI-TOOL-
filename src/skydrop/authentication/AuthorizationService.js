'use strict';

class AuthorizationService {

    hasRole(user, allowedRoles = []) {

        if (!user || !user.role) {
            return false;
        }

        return allowedRoles.includes(user.role);
    }

    isOwner(authenticatedUserId, resourceUserId) {

        return Boolean(
            authenticatedUserId &&
            resourceUserId &&
            String(authenticatedUserId) ===
            String(resourceUserId)
        );
    }

    canAccessWallet(user, wallet) {

        return Boolean(
            user &&
            wallet &&
            this.isOwner(user._id, wallet.userId)
        );
    }

    requireRole(user, roles) {

        if (!this.hasRole(user, roles)) {
            throw new Error('Permission denied.');
        }

        return true;
    }

    requireOwnership(userId, resourceUserId) {

        if (!this.isOwner(userId, resourceUserId)) {
            throw new Error('Resource ownership denied.');
        }

        return true;
    }
}

module.exports = new AuthorizationService();
