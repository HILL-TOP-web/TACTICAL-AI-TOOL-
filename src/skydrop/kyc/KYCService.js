'use strict';

const KYC = require('../models/KYC');

class KYCService {

    async submitVerification(userId, data) {

        if (!userId || !data) {
            throw new Error(
                'User and KYC information are required.'
            );
        }

        const existing = await KYC.findOne({
            userId
        });

        if (existing &&
            ['PENDING', 'APPROVED'].includes(existing.status)) {
            throw new Error(
                'An active KYC submission already exists.'
            );
        }

        return KYC.findOneAndUpdate(
            { userId },
            {
                $set: {
                    ...data,
                    userId,
                    status: 'PENDING',
                    submittedAt: new Date()
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );
    }

    async getVerification(userId) {

        return KYC.findOne({ userId })
            .select('-documents');
    }

    async approveVerification(userId, reviewerId) {

        if (!reviewerId) {
            throw new Error(
                'An authorised reviewer is required.'
            );
        }

        return KYC.findOneAndUpdate(
            {
                userId,
                status: 'PENDING'
            },
            {
                $set: {
                    status: 'APPROVED',
                    reviewedBy: reviewerId,
                    reviewedAt: new Date()
                }
            },
            {
                new: true
            }
        );
    }

    async rejectVerification(userId, reviewerId, reason) {

        if (!reviewerId || !reason) {
            throw new Error(
                'Reviewer and rejection reason are required.'
            );
        }

        return KYC.findOneAndUpdate(
            {
                userId,
                status: 'PENDING'
            },
            {
                $set: {
                    status: 'REJECTED',
                    reviewedBy: reviewerId,
                    rejectionReason: reason,
                    reviewedAt: new Date()
                }
            },
            {
                new: true
            }
        );
    }
}

module.exports = new KYCService();
