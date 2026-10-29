'use strict';

const Deposit = require('../models/Deposit');

class DepositRepository {
    async create(depositData, options = {}) {
        const deposit = new Deposit(depositData);

        await deposit.save(options);

        return deposit;
    }

    async findById(depositId, options = {}) {
        return Deposit.findById(depositId, null, options);
    }

    async findByDepositId(depositId, options = {}) {
        return Deposit.findOne({
            depositId
        }, null, options);
    }

    async findByProviderReference(
        provider,
        providerReference,
        options = {}
    ) {
        return Deposit.findOne({
            provider,
            providerReference
        }, null, options);
    }

    async findByPaymentReference(
        paymentReference,
        options = {}
    ) {
        return Deposit.findOne({
            paymentReference
        }, null, options);
    }

    async updateStatus(
        depositId,
        expectedStatuses,
        newStatus,
        updates = {},
        options = {}
    ) {
        const allowedStatuses = [
            'pending',
            'processing',
            'confirmed',
            'credited',
            'failed',
            'reversed'
        ];

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error('Invalid deposit status.');
        }

        if (!Array.isArray(expectedStatuses) ||
            expectedStatuses.length === 0) {
            throw new Error(
                'Expected deposit statuses must be provided.'
            );
        }

        const permittedUpdates = {};

        const allowedUpdateFields = [
            'transactionId',
            'providerVerified',
            'confirmedAt',
            'creditedAt',
            'metadata'
        ];

        for (const field of allowedUpdateFields) {
            if (
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {
                permittedUpdates[field] = updates[field];
            }
        }

        const result = await Deposit.findOneAndUpdate(
            {
                depositId,
                status: {
                    $in: expectedStatuses
                }
            },
            {
                $set: {
                    ...permittedUpdates,
                    status: newStatus
                }
            },
            {
                new: true,
                runValidators: true,
                ...options
            }
        );

        if (!result) {
            const existing = await Deposit.findOne({
                depositId
            }).session(options.session || null);

            if (!existing) {
                throw new Error('Deposit not found.');
            }

            throw new Error(
                `Deposit status transition rejected: current status is ${existing.status}.`
            );
        }

        return result;
    }

    async findByUserId(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            status
        } = options;

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(
            100,
            Math.max(1, Number(limit) || 20)
        );

        const filter = {
            userId
        };

        if (status) {
            filter.status = status;
        }

        return Deposit.find(filter)
            .sort({
                createdAt: -1
            })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .session(options.session || null);
    }

    async findPending(options = {}) {
        return Deposit.find({
            status: {
                $in: [
                    'pending',
                    'processing',
                    'confirmed'
                ]
            }
        })
            .sort({
                createdAt: 1
            })
            .limit(
                Math.min(
                    500,
                    Math.max(1, Number(options.limit) || 100)
                )
            )
            .session(options.session || null);
    }
}

module.exports = new DepositRepository();
module.exports.DepositRepository = DepositRepository;
