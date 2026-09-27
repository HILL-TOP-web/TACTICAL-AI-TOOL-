// src/finance/banking/PayoutProvider.js

class PayoutProvider {
  constructor() {
    this.provider = process.env.PAYOUT_PROVIDER || "moniepoint";
  }

  getProvider() {
    return this.provider;
  }

  isConfigured() {
    return Boolean(
      process.env.MONIEPOINT_API_KEY &&
      process.env.MONIEPOINT_SECRET_KEY
    );
  }

  async createPayout({
    userId,
    accountNumber,
    bankCode,
    amount,
    reference
  }) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!accountNumber || !bankCode) {
      throw new Error(
        "Bank account information is required"
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid payout amount");
    }

    if (!this.isConfigured()) {
      throw new Error(
        "Payout provider is not configured"
      );
    }

    /*
     * Replace this section with the authenticated
     * Moniepoint API request when the provider API
     * integration is connected.
     *
     * Never hard-code API keys or secret keys here.
     */

    return {
      success: true,
      provider: this.provider,
      userId,
      accountNumber,
      bankCode,
      amount,
      reference,
      status: "pending",
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = new PayoutProvider();
