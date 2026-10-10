// tactical-ai/src/skydrop/withdrawals/WithdrawalEngine.js

const crypto = require("crypto");

class WithdrawalEngine {
    constructor({
        transferEngine,
        transactionHistory,
        payoutProvider,
        minimumWithdrawal = 1
    }) {
        if (!transferEngine) {
            throw new Error("TransferEngine is required.");
        }

        if (!payoutProvider) {
            throw new Error("PayoutProvider is required.");
        }

        this.transferEngine = transferEngine;
        this.transactionHistory = transactionHistory;
        this.payoutProvider = payoutProvider;
        this.minimumWithdrawal = minimumWithdrawal;
    }

    async requestWithdrawal({
        userId,
        amount,
        currency = "NGN",
        destination,
        provider = "monnify"
    }) {
        if (!userId) {
            throw new Error("Authenticated user is required.");
        }

        if (
            !Number.isFinite(amount) ||
            amount < this.minimumWithdrawal
        ) {
            throw new Error("Invalid withdrawal amount.");
        }

        if (!destination) {
            throw new Error("Withdrawal destination is required.");
        }

        const withdrawalId = crypto.randomUUID();

        const transfer = this.transferEngine.createTransfer({
            userId,
            amount,
            currency,
            destination,
            provider
        });

        const withdrawal = {
            id: withdrawalId,
            transferId: transfer.id,
            userId,
            amount,
            currency,
            provider,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        if (this.transactionHistory) {
            this.transactionHistory.record(withdrawal);
        }

        try {
            const result = await this.payoutProvider.sendPayout(
                provider,
                {
                    reference: withdrawalId,
                    transferId: transfer.id,
                    userId,
                    amount,
                    currency,
                    destination
                }
            );

            this.transferEngine.updateStatus(
                transfer.id,
                "processing",
                {
                    providerReference: result?.reference || null
                }
            );

            if (this.transactionHistory) {
                this.transactionHistory.updateStatus(
                    withdrawalId,
                    "processing"
                );
            }

            return {
                ...withdrawal,
                status: "processing",
                providerReference: result?.reference || null,
                message:
                    "Withdrawal submitted; awaiting provider confirmation."
            };
        } catch (error) {
            this.transferEngine.updateStatus(
                transfer.id,
                "failed"
            );

            if (this.transactionHistory) {
                this.transactionHistory.updateStatus(
                    withdrawalId,
                    "failed"
                );
            }

            throw new Error(
                "Withdrawal submission failed. Check transaction status before retrying."
            );
        }
    }
}

module.exports = WithdrawalEngine;
