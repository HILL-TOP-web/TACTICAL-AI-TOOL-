'use strict';

const SOCIAL_CONTENT_TYPES = Object.freeze([
    'post',
    'comment'
]);

const SOCIAL_INTERACTION_TYPES = Object.freeze([
    'like',
    'unlike',
    'share'
]);

const LIMITS = Object.freeze({
    MAX_POST_LENGTH: 5000,
    MAX_COMMENT_LENGTH: 2000,
    MAX_USER_ID_LENGTH: 128,
    MAX_CONTENT_ID_LENGTH: 128,
    MAX_PAGE_SIZE: 100
});

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateUserId(userId) {
    if (!isNonEmptyString(userId)) {
        return {
            valid: false,
            message: 'A valid user ID is required.'
        };
    }

    if (userId.trim().length > LIMITS.MAX_USER_ID_LENGTH) {
        return {
            valid: false,
            message: 'User ID is too long.'
        };
    }

    return {
        valid: true,
        value: userId.trim()
    };
}

function validatePost(input) {
    const errors = [];

    if (!input || typeof input !== 'object') {
        return {
            valid: false,
            errors: ['Post data must be an object.']
        };
    }

    const userResult = validateUserId(input.userId);

    if (!userResult.valid) {
        errors.push(userResult.message);
    }

    if (!isNonEmptyString(input.content)) {
        errors.push('Post content is required.');
    } else if (
        input.content.trim().length > LIMITS.MAX_POST_LENGTH
    ) {
        errors.push(
            `Post content cannot exceed ${LIMITS.MAX_POST_LENGTH} characters.`
        );
    }

    if (
        input.visibility !== undefined &&
        !['public', 'followers', 'private'].includes(input.visibility)
    ) {
        errors.push('Post visibility is invalid.');
    }

    if (
        input.metadata !== undefined &&
        (
            !input.metadata ||
            typeof input.metadata !== 'object' ||
            Array.isArray(input.metadata)
        )
    ) {
        errors.push('Post metadata must be an object.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validateComment(input) {
    const errors = [];

    if (!input || typeof input !== 'object') {
        return {
            valid: false,
            errors: ['Comment data must be an object.']
        };
    }

    const userResult = validateUserId(input.userId);

    if (!userResult.valid) {
        errors.push(userResult.message);
    }

    if (!isNonEmptyString(input.postId)) {
        errors.push('A post ID is required.');
    }

    if (!isNonEmptyString(input.content)) {
        errors.push('Comment content is required.');
    } else if (
        input.content.trim().length > LIMITS.MAX_COMMENT_LENGTH
    ) {
        errors.push(
            `Comment cannot exceed ${LIMITS.MAX_COMMENT_LENGTH} characters.`
        );
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validateInteraction(input) {
    const errors = [];

    if (!input || typeof input !== 'object') {
        return {
            valid: false,
            errors: ['Interaction data must be an object.']
        };
    }

    const userResult = validateUserId(input.userId);

    if (!userResult.valid) {
        errors.push(userResult.message);
    }

    if (!isNonEmptyString(input.postId)) {
        errors.push('A post ID is required.');
    }

    if (!SOCIAL_INTERACTION_TYPES.includes(input.type)) {
        errors.push('Interaction type is invalid.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validatePagination(options = {}) {
    const limit = Number(options.limit ?? 20);
    const offset = Number(options.offset ?? 0);

    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error('Pagination limit must be a positive integer.');
    }

    if (limit > LIMITS.MAX_PAGE_SIZE) {
        throw new Error(
            `Pagination limit cannot exceed ${LIMITS.MAX_PAGE_SIZE}.`
        );
    }

    if (!Number.isInteger(offset) || offset < 0) {
        throw new Error(
            'Pagination offset must be a non-negative integer.'
        );
    }

    return {
        limit,
        offset
    };
}

function assertValid(result) {
    if (!result.valid) {
        const error = new Error(result.errors.join(' '));

        error.code = 'SOCIAL_VALIDATION_FAILED';
        error.details = result.errors;

        throw error;
    }

    return true;
}

module.exports = {
    SOCIAL_CONTENT_TYPES,
    SOCIAL_INTERACTION_TYPES,
    LIMITS,
    isNonEmptyString,
    validateUserId,
    validatePost,
    validateComment,
    validateInteraction,
    validatePagination,
    assertValid
};
