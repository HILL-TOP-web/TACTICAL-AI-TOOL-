'use strict';

const {
    SettingsAuthorizationError
} = require('./SettingsErrors');

function getActorId(actor) {
    return actor?.userId || actor?.id || null;
}

function canManageSettings(actor, userId) {
    const actorId = getActorId(actor);

    return Boolean(
        actorId &&
        typeof userId === 'string' &&
        actorId === userId
    );
}

function requireSettingsOwner(actor, userId) {
    if (!canManageSettings(actor, userId)) {
        throw new SettingsAuthorizationError();
    }
}

module.exports = {
    getActorId,
    canManageSettings,
    requireSettingsOwner
};
