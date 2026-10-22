'use strict';

const SocialValidator = require('./SocialValidator');

const SocialManager = require('./SocialManager');

module.exports = {
    SocialManager,

    SocialValidator,

    SOCIAL_CONTENT_TYPES:
        SocialValidator.SOCIAL_CONTENT_TYPES,

    SOCIAL_INTERACTION_TYPES:
        SocialValidator.SOCIAL_INTERACTION_TYPES,

    LIMITS:
        SocialValidator.LIMITS,

    validateUserId:
        SocialValidator.validateUserId,

    validatePost:
        SocialValidator.validatePost,

    validateComment:
        SocialValidator.validateComment,

    validateInteraction:
        SocialValidator.validateInteraction,

    validatePagination:
        SocialValidator.validatePagination,

    assertValid:
        SocialValidator.assertValid
};
