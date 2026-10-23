'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

class PrivacySettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return settings.privacy;
    }

    async update(actor, userId, input) {
        requireSettingsOwner(actor, userId);

        const validated = validateSettingsUpdate({
            privacy: input
        });

        return this.service.updateForUser(
            userId,
            validated
        );
    }
}

module.exports = {
    PrivacySettings
};
