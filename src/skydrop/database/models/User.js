'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
            index: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
            match: /^[a-z0-9_]+$/
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        firstName: {
            type: String,
            trim: true,
            maxlength: 100
        },

        lastName: {
            type: String,
            trim: true,
            maxlength: 100
        },

        status: {
            type: String,
            enum: [
                'pending',
                'active',
                'suspended',
                'closed'
            ],
            default: 'pending',
            index: true
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        kycStatus: {
            type: String,
            enum: [
                'not_started',
                'pending',
                'verified',
                'rejected'
            ],
            default: 'not_started',
            index: true
        },

        walletIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Wallet'
        }],

        createdAt: {
            type: Date,
            default: Date.now,
            immutable: true
        },

        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        versionKey: '__v'
    }
);

UserSchema.index({
    status: 1,
    createdAt: -1
});

UserSchema.set('toJSON', {
    transform(_document, returnedObject) {
        delete returnedObject.passwordHash;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports =
    mongoose.models.User ||
    mongoose.model('User', UserSchema);
