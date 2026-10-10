// tactical-ai/src/skydrop/transfers/TransactionHistory.js

class TransactionHistory {
    constructor() {
        this.records = new Map();
    }

    record(transaction) {
        if (!transaction || !transaction.id) {
            throw new Error("Transaction ID is required.");
        }

        const existing = this.records.get(transaction.id);

        const record = {
            ...(existing || {}),
            ...transaction,
            updatedAt: new Date().toISOString()
        };

        if (!existing) {
            record.createdAt =
                transaction.createdAt ||
                new Date().toISOString();
        }

        this.records.set(transaction.id, record);

        return { ...record };
    }

    get(transactionId) {
        const transaction = this.records.get(transactionId);

        return transaction ? { ...transaction } : null;
    }

    listByUser(userId) {
        return Array.from(this.records.values())
            .filter(item => item.userId === userId)
            .map(item => ({ ...item }));
    }

    updateStatus(transactionId, status) {
        const transaction = this.records.get(transactionId);

        if (!transaction) {
            throw new Error("Transaction not found.");
        }

        const allowedStatuses = [
            "pending",
            "processing",
            "successful",
            "failed"
        ];

        if (!allowedStatuses.includes(status)) {
            throw new Error("Invalid transaction status.");
        }

        if (
            ["successful", "failed"].includes(transaction.status)
        ) {
            throw new Error(
                "A final transaction status cannot be overwritten."
            );
        }

        transaction.status = status;
        transaction.updatedAt = new Date().toISOString();

        this.records.set(transactionId, transaction);

        return { ...transaction };
    }
}

module.exports = TransactionHistory;
