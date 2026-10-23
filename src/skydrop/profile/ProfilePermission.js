'use strict';

const {
    ProfileAuthorizationError
} = require('./ProfileErrors');

function getActorId(actor) {
    return actor?.userId || actor?.id || null;
}

function isOwner(actor, profile) {
    const actorId = getActorId(actor);

    return Boolean(
        actorId &&
        profile &&
        actorId === profile.userId
    );
}

function canViewProfile(actor, profile) {
    if (!profile || profile.status === 'disabled') {
        return false;
    }

    if (isOwner(actor, profile)) {
        return true;
    }

    if (profile.privacy === 'private') {
        return false;
    }

    if (profile.privacy === 'members') {
        return Boolean(actor && getActorId(actor));
    }

    return profile.privacy === 'public';
}

function canUpdateProfile(actor, profile) {
    return isOwner(actor, profile);
}

function canDeleteProfile(actor, profile) {
    return isOwner(actor, profile);
}

function requireOwner(actor, profile) {
    if (!isOwner(actor, profile)) {
        throw new ProfileAuthorizationError();
    }
}

function requireViewPermission(actor, profile) {
    if (!canViewProfile(actor, profile)) {
        throw new ProfileAuthorizationError();
    }
}

module.exports = {
    getActorId,
    isOwner,
    canViewProfile,
    canUpdateProfile,
    canDeleteProfile,
    requireOwner,
    requireViewPermission
};
