'use strict';

const KYC = require('../models/KYC');

class KYCValidator {

    async isApproved(userId) {

        const record = await KYC.findOne({
            userId,
            status: 'APPROVED'
        }).select('_id status');

        return Boolean(record);
    }

    async requireApproved(userId) {

        const approved = await this.isApproved(userId);

        if (!approved) {
            throw new Error(
                'Approved KYC verification is required.'
            );
        }

        return true;
    }

    async validateFinancialOperation(userId, operation) {

        const restrictedOperations = [
            'WITHDRAWAL',
            'BANK_TRANSFER',
            'HIGH_VALUE_TRANSFER'
        ];

        if (!restrictedOperations.includes(operation)) {
            return true;
        }

        return this.requireApproved(userId);
    }
}

module.exports = new KYCValidator();
