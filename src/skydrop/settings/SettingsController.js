'use strict';

const {
    SettingsAuthorizationError
} = require('./SettingsErrors');

function getActor(req) {
    const user = req.user;

    if (!user || !(user.userId || user.id)) {
        throw new SettingsAuthorizationError();
    }

    return {
        userId: user.userId || user.id
    };
}

function createSettingsController(service) {
    return {
        async get(req, res, next) {
            try {
                const actor = getActor(req);

                const settings = await service.getForUser(
                    actor.userId
                );

                res.status(200).json({
                    success: true,
                    data: settings
                });
            } catch (error) {
                next(error);
            }
        },

        async update(req, res, next) {
            try {
                const actor = getActor(req);

                const expectedVersion =
                    req.headers['if-match'] !== undefined
                        ? Number(req.headers['if-match'])
                        : undefined;

                if (
                    expectedVersion !== undefined &&
                    (
                        !Number.isSafeInteger(expectedVersion) ||
                        expectedVersion < 1
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_SETTINGS_VERSION',
                            message: 'Invalid settings version.'
                        }
                    });
                }

                const settings = await service.updateForUser(
                    actor.userId,
                    req.body,
                    expectedVersion
                );

                res.status(200).json({
                    success: true,
                    message: 'Settings updated successfully.',
                    data: settings
                });
            } catch (error) {
                next(error);
            }
        },

        async reset(req, res, next) {
            try {
                const actor = getActor(req);

                const settings = await service.resetForUser(
                    actor.userId
                );

                res.status(200).json({
                    success: true,
                    message: 'Settings restored to defaults.',
                    data: settings
                });
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createSettingsController
};
