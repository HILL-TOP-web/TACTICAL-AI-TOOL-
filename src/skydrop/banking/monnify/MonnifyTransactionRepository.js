'use strict';

const MonnifyTransaction =
    require('../../models/MonnifyTransaction');

class MonnifyTransactionRepository {

    async create(data) {
        return MonnifyTransaction.create(data);
    }

    async findByReference(reference) {
        return MonnifyTransaction.findOne({
            reference
        });
    }

    async findByProviderReference(providerReference) {
        return MonnifyTransaction.findOne({
            providerReference
        });
    }

    async updateStatus(reference, status, providerData = {}) {

        return MonnifyTransaction.findOneAndUpdate(
            { reference },
            {
                $set: {
                    status,
                    providerData,
                    updatedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async findPending(limit = 100) {
        return MonnifyTransaction.find({
            status: 'PENDING'
        })
            .sort({ createdAt: 1 })
            .limit(limit);
    }
}

module.exports = new MonnifyTransactionRepository();
