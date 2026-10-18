'use strict';

class PayoutProvider {
    constructor({ providers }) {
        if (!providers || typeof providers !== 'object') {
            throw new Error('Payout providers are required.');
        }

        this.providers = providers;
    }

    getProvider(name) {
        const provider = this.providers[name];

        if (!provider) {
            throw new Error(
                `Payout provider "${name}" is unavailable.`
            );
        }

        return provider;
    }

    async disburse({
        provider = 'monnify',
        ...request
    }) {
        const gateway = this.getProvider(provider);

        if (typeof gateway.disburse !== 'function') {
            throw new Error(
                'Selected provider does not support disbursement.'
            );
        }

        return gateway.disburse(request);
    }

    async getTransferStatus({
        provider = 'monnify',
        ...request
    }) {
        const gateway = this.getProvider(provider);

        if (
            typeof gateway.getTransferStatus !== 'function'
        ) {
            throw new Error(
                'Selected provider does not support status checks.'
            );
        }

        return gateway.getTransferStatus(request);
    }
}

module.exports = PayoutProvider;
