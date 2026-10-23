'use strict';

const {
    PROFILE_STATUSES
} = require('./ProfileModel');

const {
    ProfileValidationError
} = require('./ProfileErrors');

const {
    requireOwner
} = require('./ProfilePermissions');

function getProfileStatus(profile) {
    if (!profile) {
        return 'not_found';
    }

    return profile.status;
}

function setProfileStatus(actor, profile, status) {
    requireOwner(actor, profile);

    if (!PROFILE_STATUSES.includes(status)) {
        throw new ProfileValidationError(
            'Invalid profile status.'
        );
    }

    return {
        ...profile,
        status,
        updatedAt: new Date().toISOString()
    };
}

function isProfileActive(profile) {
    return Boolean(
        profile &&
        profile.status === 'active'
    );
}

function getVerificationStatus(profile) {
    if (!profile) {
        return 'unknown';
    }

    return profile.verificationStatus || 'unverified';
}

module.exports = {
    getProfileStatus,
    setProfileStatus,
    isProfileActive,
    getVerificationStatus
};
