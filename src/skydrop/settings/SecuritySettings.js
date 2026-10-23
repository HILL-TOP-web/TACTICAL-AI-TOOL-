'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

class SecuritySettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return settings.security;
    }

    async update(actor, userId, input) {
        requireSettingsOwner(actor, userId);

        const validated = validateSettingsUpdate({
            security: input
        });

        // Changing the preference does not itself enroll or
        // unenroll the user in two-factor authentication.
        // The authentication service must perform that workflow.
        if (
            Object.hasOwn(input, 'twoFactorEnabled') &&
            input.twoFactorEnabled !== undefined
        ) {
            throw new Error(
                'Use the authentication security service to change two-factor authentication.'
            );
        }

        return this.service.updateForUser(
            userId,
            validated
        );
    }
}

module.exports = {
    SecuritySettings
};
