'use strict';

const DEFAULT_SETTINGS = Object.freeze({
    account: Object.freeze({
        displayName: '',
        language: 'en',
        timezone: 'Africa/Lagos'
    }),

    privacy: Object.freeze({
        profileVisibility: 'members',
        showOnlineStatus: true,
        showActivityStatus: true,
        allowMessagesFrom: 'members',
        searchableByUsername: true
    }),

    security: Object.freeze({
        twoFactorEnabled: false,
        loginAlertsEnabled: true,
        suspiciousActivityAlertsEnabled: true
    }),

    notifications: Object.freeze({
        emailEnabled: true,
        pushEnabled: true,
        marketingEnabled: false,
        transactionAlertsEnabled: true,
        securityAlertsEnabled: true,
        socialAlertsEnabled: true,
        miningAlertsEnabled: true
    }),

    display: Object.freeze({
        theme: 'system',
        compactMode: false,
        showBalances: true,
        currency: 'NGN'
    }),

    accessibility: Object.freeze({
        reducedMotion: false,
        highContrast: false,
        largeText: false,
        screenReaderOptimized: false
    }),

    session: Object.freeze({
        sessionTimeoutMinutes: 30,
        notifyOnNewLogin: true
    })
});

function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

module.exports = {
    DEFAULT_SETTINGS,
    cloneDefaults
};
