// tactical-ai/src/skydrop/banking/PayoutStatus.js

class PayoutStatus {
    constructor() {
        this.payouts = new Map();
    }

    create(payoutId, details = {}) {
        if (!payoutId) {
            throw new Error("Payout ID is required.");
        }

        if (this.payouts.has(payoutId)) {
            throw new Error("Payout already exists.");
        }

        const payout = {
            id: payoutId,
            ...details,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.payouts.set(payoutId, payout);

        return { ...payout };
    }

    update(payoutId, status, providerReference = null) {
        const allowedStatuses = [
            "pending",
            "processing",
            "successful",
            "failed"
        ];

        if (!allowedStatuses.includes(status)) {
            throw new Error("Invalid payout status.");
        }

        const payout = this.payouts.get(payoutId);

        if (!payout) {
            throw new Error("Payout not found.");
        }

        if (["successful", "failed"].includes(payout.status)) {
            throw new Error(
                "A final payout status cannot be overwritten."
            );
        }

        payout.status = status;
        payout.updatedAt = new Date().toISOString();

        if (providerReference) {
            payout.providerReference = providerReference;
        }

        this.payouts.set(payoutId, payout);

        return { ...payout };
    }

    get(payoutId) {
        const payout = this.payouts.get(payoutId);

        return payout ? { ...payout } : null;
    }
}

module.exports = PayoutStatus;
