'use strict';

const crypto = require('crypto');

class UserProfile {
  constructor(options = {}) {
    this.users = options.users || new Map();
  }

  /**
   * Generate a unique internal user ID.
   */
  generateUserId() {
    return crypto.randomUUID();
  }

  /**
   * Validate required profile data.
   */
  validateProfile(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('User profile data is required.');
    }

    if (
      typeof data.fullName !== 'string' ||
      data.fullName.trim().length < 2
    ) {
      throw new Error('A valid full name is required.');
    }

    if (
      typeof data.username !== 'string' ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(data.username.trim())
    ) {
      throw new Error(
        'Username must contain 3-30 letters, numbers, or underscores.'
      );
    }

    if (
      typeof data.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    ) {
      throw new Error('A valid email address is required.');
    }

    return true;
  }

  /**
   * Create a new user profile.
   */
  createProfile(data) {
    this.validateProfile(data);

    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        throw new Error('Username is already in use.');
      }

      if (user.email.toLowerCase() === email) {
        throw new Error('Email is already registered.');
      }
    }

    const userId = this.generateUserId();
    const now = new Date().toISOString();

    const profile = {
      userId,
      fullName: data.fullName.trim(),
      username,
      email,
      avatar: data.avatar || null,
      bio: data.bio || '',
      country: data.country || null,
      verified: false,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(userId, profile);

    return {
      ...profile
    };
  }

  /**
   * Find a user by ID.
   */
  getProfile(userId) {
    const profile = this.users.get(userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    return {
      ...profile
    };
  }

  /**
   * Find a user by username.
   */
  findByUsername(username) {
    if (typeof username !== 'string') {
      return null;
    }

    const normalized = username.trim().toLowerCase();

    for (const profile of this.users.values()) {
      if (profile.username.toLowerCase() === normalized) {
        return {
          ...profile
        };
      }
    }

    return null;
  }

  /**
   * Update editable profile information.
   */
  updateProfile(userId, updates = {}) {
    const profile = this.users.get(userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    if (updates.fullName !== undefined) {
      if (
        typeof updates.fullName !== 'string' ||
        updates.fullName.trim().length < 2
      ) {
        throw new Error('Invalid full name.');
      }

      profile.fullName = updates.fullName.trim();
    }

    if (updates.bio !== undefined) {
      if (typeof updates.bio !== 'string') {
        throw new Error('Bio must be a string.');
      }

      profile.bio = updates.bio.trim();
    }

    if (updates.avatar !== undefined) {
      profile.avatar = updates.avatar;
    }

    if (updates.country !== undefined) {
      profile.country = updates.country;
    }

    profile.updatedAt = new Date().toISOString();

    this.users.set(userId, profile);

    return {
      ...profile
    };
  }

  /**
   * Mark profile as verified.
   */
  setVerified(userId, verified = true) {
    const profile = this.users.get(userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    profile.verified = Boolean(verified);
    profile.updatedAt = new Date().toISOString();

    this.users.set(userId, profile);

    return {
      ...profile
    };
  }

  /**
   * Activate or deactivate account.
   */
  setActive(userId, active) {
    const profile = this.users.get(userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    profile.active = Boolean(active);
    profile.updatedAt = new Date().toISOString();

    this.users.set(userId, profile);

    return {
      ...profile
    };
  }

  /**
   * Delete profile from the current store.
   */
  deleteProfile(userId) {
    if (!this.users.has(userId)) {
      throw new Error('User profile not found.');
    }

    this.users.delete(userId);

    return {
      success: true,
      userId
    };
  }
}

module.exports = UserProfile;
