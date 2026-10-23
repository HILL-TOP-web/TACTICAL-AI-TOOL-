'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

class AccountSettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return settings.account;
    }

    async update(actor, userId, input) {
        requireSettingsOwner(actor, userId);

        const validated = validateSettingsUpdate({
            account: input
        });

        return this.service.updateForUser(
            userId,
            validated
        );
    }
}

module.exports = {
    AccountSettings
};
