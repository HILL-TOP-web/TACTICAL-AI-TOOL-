// tactical-ai/src/skydrop/transfers/TransferEngine.js

const crypto = require("crypto");

const ALLOWED_STATUSES = [
    "pending",
    "processing",
    "successful",
    "failed"
];

class TransferEngine {
    constructor() {
        this.transfers = new Map();
    }

    createTransfer({
        userId,
        amount,
        currency,
        destination,
        provider = "monnify"
    }) {
        if (!userId) {
            throw new Error("User ID is required.");
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Invalid transfer amount.");
        }

        if (!currency || !destination || !provider) {
            throw new Error(
                "Currency, destination, and provider are required."
            );
        }

        const transfer = {
            id: crypto.randomUUID(),
            userId,
            amount,
            currency,
            destination,
            provider,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.transfers.set(transfer.id, transfer);

        return { ...transfer };
    }

    getTransfer(transferId) {
        const transfer = this.transfers.get(transferId);

        if (!transfer) {
            throw new Error("Transfer not found.");
        }

        return { ...transfer };
    }

    updateStatus(transferId, status, details = {}) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw new Error("Invalid transfer status.");
        }

        const transfer = this.transfers.get(transferId);

        if (!transfer) {
            throw new Error("Transfer not found.");
        }

        if (["successful", "failed"].includes(transfer.status)) {
            throw new Error(
                "A final transfer status cannot be overwritten."
            );
        }

        transfer.status = status;
        transfer.updatedAt = new Date().toISOString();

        if (details.providerReference) {
            transfer.providerReference = details.providerReference;
        }

        this.transfers.set(transferId, transfer);

        return { ...transfer };
    }

    listByUser(userId) {
        return Array.from(this.transfers.values())
            .filter(item => item.userId === userId)
            .map(item => ({ ...item }));
    }
}

module.exports = TransferEngine;
