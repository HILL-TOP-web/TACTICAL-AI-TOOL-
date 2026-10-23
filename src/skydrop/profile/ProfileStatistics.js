'use strict';

const {
    ProfileNotFoundError
} = require('./ProfileErrors');

const {
    requireOwner
} = require('./ProfilePermissions');

class ProfileStatistics {
    constructor(repository) {
        this.repository = repository;
    }

    async getOwnStatistics(actor, profileId) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const stats = profile.statistics || {};

        return {
            followers: Math.max(0, Number(stats.followers) || 0),
            following: Math.max(0, Number(stats.following) || 0),
            posts: Math.max(0, Number(stats.posts) || 0)
        };
    }

    async updateStatistics(profileId, changes) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        const allowed = ['followers', 'following', 'posts'];

        for (const key of Object.keys(changes)) {
            if (!allowed.includes(key)) {
                throw new TypeError(
                    `Unsupported statistic: ${key}`
                );
            }

            if (
                !Number.isSafeInteger(changes[key]) ||
                changes[key] < 0
            ) {
                throw new TypeError(
                    `${key} must be a non-negative safe integer.`
                );
            }
        }

        return this.repository.update(profileId, {
            statistics: {
                ...profile.statistics,
                ...changes
            }
        });
    }
}

module.exports = {
    ProfileStatistics
};
