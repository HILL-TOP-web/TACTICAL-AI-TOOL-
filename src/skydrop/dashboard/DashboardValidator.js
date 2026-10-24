'use strict';

class DashboardValidator {
    validateUserId(userId) {
        const errors = [];

        if (
            userId === undefined ||
            userId === null ||
            String(userId).trim() === ''
        ) {
            errors.push('A user ID is required.');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    validatePagination(options = {}) {
        const errors = [];

        const limit = options.limit ?? 10;
        const offset = options.offset ?? 0;

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            errors.push(
                'Limit must be an integer between 1 and 100.'
            );
        }

        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            errors.push(
                'Offset must be a non-negative integer.'
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            value: {
                limit,
                offset
            }
        };
    }

    validateDashboardRequest(req) {
        if (!req || typeof req !== 'object') {
            return {
                valid: false,
                errors: ['A valid request object is required.']
            };
        }

        const userId =
            req.user && (req.user.id || req.user.userId);

        const userResult = this.validateUserId(userId);

        if (!userResult.valid) {
            return userResult;
        }

        return {
            valid: true,
            errors: [],
            userId: String(userId)
        };
    }
}

module.exports = DashboardValidator;
