'use strict';

const {
    ProfileNotFoundError,
    ProfileAuthorizationError
} = require('./ProfileErrors');

function getActor(req) {
    // Your authentication middleware must set req.user.
    const user = req.user;

    if (!user || !(user.userId || user.id)) {
        throw new ProfileAuthorizationError();
    }

    return {
        userId: user.userId || user.id,
        roles: Array.isArray(user.roles) ? user.roles : []
    };
}

function getProfileId(req) {
    return req.params.profileId;
}

function createProfileController(service) {
    return {
        async getById(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.getById(
                    actor,
                    getProfileId(req)
                );

                res.status(200).json({
                    success: true,
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async getByUsername(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.getByUsername(
                    actor,
                    req.params.username
                );

                res.status(200).json({
                    success: true,
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async update(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.update(
                    actor,
                    getProfileId(req),
                    req.body
                );

                res.status(200).json({
                    success: true,
                    message: 'Profile updated successfully.',
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async updateAvatar(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.updateAvatar(
                    actor,
                    getProfileId(req),
                    req.body?.avatarUrl
                );

                res.status(200).json({
                    success: true,
                    message: 'Avatar updated successfully.',
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async removeAvatar(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.removeAvatar(
                    actor,
                    getProfileId(req)
                );

                res.status(200).json({
                    success: true,
                    message: 'Avatar removed successfully.',
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async updatePrivacy(req, res, next) {
            try {
                const actor = getActor(req);

                const profile = await service.updatePrivacy(
                    actor,
                    getProfileId(req),
                    req.body?.privacy
                );

                res.status(200).json({
                    success: true,
                    message: 'Privacy settings updated.',
                    data: profile
                });
            } catch (error) {
                next(error);
            }
        },

        async getStatistics(req, res, next) {
            try {
                const actor = getActor(req);

                const data = await service.getOwnStatistics(
                    actor,
                    getProfileId(req)
                );

                res.status(200).json({
                    success: true,
                    data
                });
            } catch (error) {
                next(error);
            }
        },

        async getActivity(req, res, next) {
            try {
                const actor = getActor(req);

                const data = await service.getOwnActivity(
                    actor,
                    getProfileId(req)
                );

                res.status(200).json({
                    success: true,
                    data
                });
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createProfileController
};
