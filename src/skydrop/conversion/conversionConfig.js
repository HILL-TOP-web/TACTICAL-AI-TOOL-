/**
 * SkyDrop Conversion Configuration
 *
 * Current SkyDrop valuation configuration:
 *
 * 0.00001 SKD = $2,000 USD
 * $1 USD = ₦2,000 NGN
 *
 * Therefore:
 * 0.00001 SKD = $2,000 = ₦4,000,000
 *
 * Equivalent full-unit SKD rate:
 * 1 SKD = $200,000,000 USD
 */

const SKD_TO_USD_RATE = 200000000;
const USD_TO_NGN_RATE = 2000;

const conversionConfig = {
  currencies: {
    skd: "SKD",
    usd: "USD",
    ngn: "NGN",
  },

  rates: {
    // 1 SKD = $200,000,000
    skdToUsd: SKD_TO_USD_RATE,

    // $1 = ₦2,000
    usdToNgn: USD_TO_NGN_RATE,
  },

  /**
   * Automatically calculates the NGN value of 1 SKD.
   *
   * 1 SKD
   * × $200,000,000
   * × ₦2,000
   * = ₦400,000,000,000
   */
  get skdToNgn() {
    return this.rates.skdToUsd * this.rates.usdToNgn;
  },
};

module.exports = conversionConfig;
