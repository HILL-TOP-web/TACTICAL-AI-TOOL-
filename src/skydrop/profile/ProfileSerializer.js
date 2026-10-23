'use strict';

function serializeProfile(profile, options = {}) {
    if (!profile) {
        return null;
    }

    const isOwner = Boolean(options.isOwner);

    const result = {
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        privacy: profile.privacy,
        status: profile.status,
        createdAt: profile.createdAt,
        statistics: {
            followers: profile.statistics?.followers || 0,
            following: profile.statistics?.following || 0,
            posts: profile.statistics?.posts || 0
        }
    };

    if (isOwner) {
        result.userId = profile.userId;
        result.location = profile.location;
        result.website = profile.website;
        result.updatedAt = profile.updatedAt;
        result.lastActiveAt = profile.lastActiveAt;
        result.verificationStatus =
            profile.verificationStatus || 'unverified';
    }

    // Never serialize passwords, authentication tokens,
    // API keys, banking credentials, or secret configuration.

    return result;
}

module.exports = {
    serializeProfile
};
