'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

const SUPPORTED_LANGUAGES = Object.freeze([
    'en',
    'en-GB',
    'en-US',
    'fr',
    'es',
    'pt',
    'ar',
    'ha',
    'yo',
    'ig'
]);

class LanguageSettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return {
            language: settings.account.language,
            supportedLanguages: [...SUPPORTED_LANGUAGES]
        };
    }

    async update(actor, userId, language) {
        requireSettingsOwner(actor, userId);

        if (!SUPPORTED_LANGUAGES.includes(language)) {
            const {
                SettingsValidationError
            } = require('./SettingsErrors');

            throw new SettingsValidationError(
                'This language is not currently supported.'
            );
        }

        const validated = validateSettingsUpdate({
            account: { language }
        });

        return this.service.updateForUser(
            userId,
            validated
        );
    }
}

module.exports = {
    LanguageSettings,
    SUPPORTED_LANGUAGES
};
