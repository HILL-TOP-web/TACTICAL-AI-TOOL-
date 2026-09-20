/**
 * SkyDrop Conversion Configuration
 *
 * Central configuration for SKD, USD and NGN conversion.
 *
 * Current configured values:
 * 1 SKD = $2,000 USD
 * $1 USD = ₦2,000 NGN
 * Therefore:
 * 1 SKD = ₦4,000,000 NGN
 *
 * Keep conversion rates here so they are not duplicated
 * throughout the SkyDrop application.
 */

const SKD_TO_USD_RATE = 2000;
const USD_TO_NGN_RATE = 2000;

const conversionConfig = {
  currencies: {
    skd: "SKD",
    usd: "USD",
    ngn: "NGN",
  },

  rates: {
    skdToUsd: SKD_TO_USD_RATE,
    usdToNgn: USD_TO_NGN_RATE,
  },

  get skdToNgn() {
    return this.rates.skdToUsd * this.rates.usdToNgn;
  },
};

module.exports = conversionConfig;
