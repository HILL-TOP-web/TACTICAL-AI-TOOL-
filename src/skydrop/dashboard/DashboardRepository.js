'use strict';

class DashboardRepository {
    constructor(options = {}) {
        this.users = new Map();

        if (options.users) {
            for (const user of options.users) {
                if (user && user.id !== undefined) {
                    this.users.set(
                        String(user.id),
                        { ...user }
                    );
                }
            }
        }
    }

    async getUser(userId) {
        this._validateUserId(userId);

        const user = this.users.get(String(userId));

        return user ? { ...user } : null;
    }

    async saveUser(user) {
        if (
            !user ||
            user.id === undefined ||
            user.id === null
        ) {
            throw new TypeError(
                'A user record with an ID is required.'
            );
        }

        const id = String(user.id);

        const existing = this.users.get(id);

        const savedUser = {
            ...(existing || {}),
            ...user,
            id
        };

        this.users.set(id, savedUser);

        return { ...savedUser };
    }

    async updateUser(userId, updates) {
        this._validateUserId(userId);

        if (!updates || typeof updates !== 'object') {
            throw new TypeError(
                'User updates must be an object.'
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                'id'
            )
        ) {
            throw new Error(
                'The user ID cannot be changed.'
            );
        }

        const id = String(userId);
        const existing = this.users.get(id);

        if (!existing) {
            return null;
        }

        const updatedUser = {
            ...existing,
            ...updates,
            id
        };

        this.users.set(id, updatedUser);

        return { ...updatedUser };
    }

    async deleteUser(userId) {
        this._validateUserId(userId);

        return this.users.delete(String(userId));
    }

    _validateUserId(userId) {
        if (
            userId === undefined ||
            userId === null ||
            String(userId).trim() === ''
        ) {
            throw new TypeError(
                'A valid user ID is required.'
            );
        }
    }
}

module.exports = DashboardRepository;
