// tactical-ai/src/skydrop/banking/BankAccounts.js

const crypto = require("crypto");

class BankAccounts {
    constructor() {
        this.accounts = new Map();
    }

    addAccount({
        userId,
        bankName,
        accountNumber,
        accountName
    }) {
        if (
            !userId ||
            !bankName ||
            !accountNumber ||
            !accountName
        ) {
            throw new Error(
                "All bank account details are required."
            );
        }

        const normalizedNumber = String(accountNumber).trim();

        if (!/^\d{10}$/.test(normalizedNumber)) {
            throw new Error(
                "The bank account number must contain 10 digits."
            );
        }

        const id = crypto.randomUUID();

        const account = {
            id,
            userId,
            bankName,
            accountNumber: normalizedNumber,
            accountName,
            createdAt: new Date().toISOString()
        };

        this.accounts.set(id, account);

        return this._publicAccount(account);
    }

    _publicAccount(account) {
        return {
            id: account.id,
            userId: account.userId,
            bankName: account.bankName,
            accountName: account.accountName,
            accountNumber:
                `****${account.accountNumber.slice(-4)}`,
            createdAt: account.createdAt
        };
    }

    listAccounts(userId) {
        return Array.from(this.accounts.values())
            .filter(account => account.userId === userId)
            .map(account => this._publicAccount(account));
    }

    getAccount(userId, accountId) {
        const account = this.accounts.get(accountId);

        if (!account || account.userId !== userId) {
            throw new Error("Bank account not found.");
        }

        return this._publicAccount(account);
    }

    removeAccount(userId, accountId) {
        const account = this.accounts.get(accountId);

        if (!account || account.userId !== userId) {
            throw new Error("Bank account not found.");
        }

        this.accounts.delete(accountId);

        return {
            success: true,
            message: "Bank account removed."
        };
    }
}

module.exports = BankAccounts;
