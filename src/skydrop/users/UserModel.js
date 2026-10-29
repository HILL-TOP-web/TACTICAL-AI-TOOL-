'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
            index: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },

        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active'
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
            min: 0
        },

        lockedUntil: {
            type: Date,
            default: null
        },

        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        versionKey: false
    }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports =
    mongoose.models.SkyDropUser ||
    mongoose.model('SkyDropUser', userSchema);
