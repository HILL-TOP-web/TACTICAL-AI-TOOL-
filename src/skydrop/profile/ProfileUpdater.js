'use strict';

const {
    validateProfileUpdate
} = require('./ProfileValidator');

const {
    ProfileNotFoundError
} = require('./ProfileErrors');

const {
    requireOwner
} = require('./ProfilePermissions');

class ProfileUpdater {
    constructor(repository) {
        this.repository = repository;
    }

    async update(actor, profileId, input) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const changes = validateProfileUpdate(input);

        const updated = await this.repository.update(
            profileId,
            changes
        );

        if (!updated) {
            throw new ProfileNotFoundError();
        }

        return updated;
    }

    async updateByUserId(actor, userId, input) {
        const actorId = actor?.userId || actor?.id;

        if (!actorId || actorId !== userId) {
            const {
                ProfileAuthorizationError
            } = require('./ProfileErrors');

            throw new ProfileAuthorizationError();
        }

        const profile = await this.repository.findByUserId(userId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        return this.update(actor, profile.id, input);
    }
}

module.exports = {
    ProfileUpdater
};
