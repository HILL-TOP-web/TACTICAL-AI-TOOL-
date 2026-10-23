'use strict';

const {
    SettingsRepository
} = require('./SettingsRepository');

const {
    SettingsNotFoundError
} = require('./SettingsErrors');

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    cloneDefaults
} = require('./SettingsDefaults');

class SettingsService {
    constructor(options = {}) {
        this.repository =
            options.repository || new SettingsRepository();
    }

    async createForUser(userId) {
        const existing = await this.repository.findByUserId(userId);

        if (existing) {
            return existing;
        }

        return this.repository.create(
            userId,
            cloneDefaults()
        );
    }

    async getForUser(userId) {
        let settings = await this.repository.findByUserId(userId);

        if (!settings) {
            settings = await this.createForUser(userId);
        }

        return settings;
    }

    async updateForUser(
        userId,
        input,
        expectedVersion
    ) {
        const validated = validateSettingsUpdate(input);

        let existing = await this.repository.findByUserId(userId);

        if (!existing) {
            existing = await this.createForUser(userId);
        }

        const updated = await this.repository.updateByUserId(
            userId,
            validated,
            expectedVersion
        );

        if (!updated) {
            throw new SettingsNotFoundError();
        }

        return updated;
    }

    async resetForUser(userId) {
        const existing = await this.repository.findByUserId(userId);

        if (!existing) {
            throw new SettingsNotFoundError();
        }

        return this.repository.updateByUserId(
            userId,
            cloneDefaults()
        );
    }

    async deleteForUser(userId) {
        return this.repository.deleteByUserId(userId);
    }
}

module.exports = {
    SettingsService
};
