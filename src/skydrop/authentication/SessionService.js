'use strict';

const crypto = require('node:crypto');

const sessions = new Map();

function createSession(userId) {
    const sessionId = crypto.randomUUID();

    const session = {
        sessionId,
        userId: String(userId),
        createdAt: new Date()
    };

    sessions.set(sessionId, session);

    return { ...session };
}

function getSession(sessionId) {
    const session = sessions.get(sessionId);

    return session ? { ...session } : null;
}

function revokeSession(sessionId) {
    return sessions.delete(sessionId);
}

function revokeUserSessions(userId) {
    const normalizedId = String(userId);
    let revoked = 0;

    for (const [sessionId, session] of sessions.entries()) {
        if (session.userId === normalizedId) {
            sessions.delete(sessionId);
            revoked++;
        }
    }

    return revoked;
}

module.exports = {
    createSession,
    getSession,
    revokeSession,
    revokeUserSessions
};
