'use strict';

const {
    ProfileModel,
    createProfile,
    validateProfileShape,
    PROFILE_STATUSES,
    PRIVACY_LEVELS
} = {
    ...require('./ProfileModel'),
    ProfileModel: undefined
};

const {
    ProfileRepository
} = require('./ProfileRepository');

const {
    ProfileService
} = require('./ProfileService');

const {
    ProfileUpdater
} = require('./ProfileUpdater');

const {
    ProfileAvatar,
    validateAvatarUrl
} = require('./ProfileAvatar');

const {
    ProfileActivity
} = require('./ProfileActivity');

const {
    ProfileStatistics
} = require('./ProfileStatistics');

const {
    createProfileController
} = require('./ProfileController');

const {
    createProfileRoutes
} = require('./ProfileRoutes');

const {
    validateProfileUpdate,
    validateProfileStatus,
    validateProfileId
} = require('./ProfileValidator');

const ProfilePermissions = require('./ProfilePermissions');
const ProfilePrivacy = require('./ProfilePrivacy');
const ProfileStatus = require('./ProfileStatus');
const ProfileSerializer = require('./ProfileSerializer');
const ProfileErrors = require('./ProfileErrors');

module.exports = {
    createProfile,
    validateProfileShape,
    PROFILE_STATUSES,
    PRIVACY_LEVELS,

    ProfileRepository,
    ProfileService,
    ProfileUpdater,
    ProfileAvatar,
    ProfileActivity,
    ProfileStatistics,

    createProfileController,
    createProfileRoutes,

    validateProfileUpdate,
    validateProfileStatus,
    validateProfileId,
    validateAvatarUrl,

    ProfilePermissions,
    ProfilePrivacy,
    ProfileStatus,
    ProfileSerializer,
    ProfileErrors
};
