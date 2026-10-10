// tactical-ai/src/skydrop/banking/PayoutProvider.js

class PayoutProvider {
    constructor() {
        this.providers = new Map();
    }

    register(name, provider) {
        if (!name || !provider) {
            throw new Error(
                "Provider name and implementation are required."
            );
        }

        if (typeof provider.sendPayout !== "function") {
            throw new Error(
                "Provider must implement sendPayout()."
            );
        }

        if (this.providers.has(name)) {
            throw new Error(
                `Provider "${name}" is already registered.`
            );
        }

        this.providers.set(name, provider);
    }

    async sendPayout(providerName, payoutDetails) {
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(
                `Unsupported payout provider: ${providerName}`
            );
        }

        return provider.sendPayout(payoutDetails);
    }

    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
}

module.exports = PayoutProvider;
