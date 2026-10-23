'use strict';

const {
    ProfileRepository
} = require('./ProfileRepository');

const {
    ProfileUpdater
} = require('./ProfileUpdater');

const {
    ProfileAvatar
} = require('./ProfileAvatar');

const {
    ProfileActivity
} = require('./ProfileActivity');

const {
    ProfileStatistics
} = require('./ProfileStatistics');

const {
    ProfileNotFoundError,
    ProfileConflictError
} = require('./ProfileErrors');

const {
    requireOwner,
    requireViewPermission
} = require('./ProfilePermissions');

const {
    getVisibleFields
} = require('./ProfilePrivacy');

const {
    serializeProfile
} = require('./ProfileSerializer');

class ProfileService {
    constructor(options = {}) {
        this.repository =
            options.repository || new ProfileRepository();

        this.updater = new ProfileUpdater(this.repository);
        this.avatar = new ProfileAvatar(this.repository);
        this.activity = new ProfileActivity(this.repository);
        this.statistics = new ProfileStatistics(this.repository);
    }

    async createForUser(userId, input = {}) {
        if (typeof userId !== 'string' || !userId.trim()) {
            throw new TypeError('Authenticated user ID is required.');
        }

        const existing = await this.repository.findByUserId(userId);

        if (existing) {
            throw new ProfileConflictError(
                'A profile already exists for this user.'
            );
        }

        return this.repository.create({
            ...input,
            userId,
            status: 'pending',
            verified: false,
            verificationStatus: 'unverified'
        });
    }

    async getById(actor, profileId) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireViewPermission(actor, profile);

        const isOwner =
            Boolean(actor) &&
            (actor.userId || actor.id) === profile.userId;

        return serializeProfile(profile, { isOwner });
    }

    async getByUserId(actor, userId) {
        const profile = await this.repository.findByUserId(userId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireViewPermission(actor, profile);

        const isOwner =
            Boolean(actor) &&
            (actor.userId || actor.id) === profile.userId;

        return serializeProfile(profile, { isOwner });
    }

    async getByUsername(actor, username) {
        const profile = await this.repository.findByUsername(username);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireViewPermission(actor, profile);

        const isOwner =
            Boolean(actor) &&
            (actor.userId || actor.id) === profile.userId;

        return serializeProfile(profile, { isOwner });
    }

    async update(actor, profileId, input) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const updated = await this.updater.update(
            actor,
            profileId,
            input
        );

        await this.activity.record(
            actor,
            profileId,
            'profile_updated'
        );

        return serializeProfile(updated, { isOwner: true });
    }

    async updateAvatar(actor, profileId, avatarUrl) {
        const updated = await this.avatar.update(
            actor,
            profileId,
            avatarUrl
        );

        await this.activity.record(
            actor,
            profileId,
            'avatar_updated'
        );

        return serializeProfile(updated, { isOwner: true });
    }

    async removeAvatar(actor, profileId) {
        const updated = await this.avatar.remove(
            actor,
            profileId
        );

        return serializeProfile(updated, { isOwner: true });
    }

    async updatePrivacy(actor, profileId, privacy) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const updated = await this.repository.update(profileId, {
            privacy
        });

        await this.activity.record(
            actor,
            profileId,
            'privacy_updated'
        );

        return serializeProfile(updated, { isOwner: true });
    }

    async getVisibleProfile(actor, profileId) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        return getVisibleFields(actor, profile);
    }

    async getOwnStatistics(actor, profileId) {
        return this.statistics.getOwnStatistics(
            actor,
            profileId
        );
    }

    async getOwnActivity(actor, profileId) {
        return this.activity.getOwnActivity(
            actor,
            profileId
        );
    }
}

module.exports = {
    ProfileService
};
