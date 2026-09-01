/**
 * Confidence Calculator
 *
 * Produces bounded confidence scores for simulated
 * decision-support outputs.
 *
 * This is not a guarantee of correctness.
 */

class Confidence {
  constructor(options = {}) {
    this.minimum = this.normalize(
      options.minimum ?? 0
    );

    this.maximum = this.normalize(
      options.maximum ?? 1
    );

    if (this.minimum >= this.maximum) {
      throw new Error(
        "Confidence minimum must be less than maximum"
      );
    }
  }

  /**
   * Keep a number between 0 and 1.
   */
  normalize(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.min(1, Math.max(0, number));
  }

  /**
   * Convert confidence to percentage.
   */
  percentage(value) {
    return Math.round(
      this.normalize(value) * 100
    );
  }

  /**
   * Convert numerical confidence to a label.
   */
  label(value) {
    const confidence = this.normalize(value);

    if (confidence >= 0.85) {
      return "high";
    }

    if (confidence >= 0.60) {
      return "moderate";
    }

    if (confidence >= 0.35) {
      return "low";
    }

    return "very-low";
  }

  /**
   * Calculate confidence from evidence quality.
   */
  fromEvidence(evidence = []) {
    if (!Array.isArray(evidence) || evidence.length === 0) {
      return {
        score: 0,
        percentage: 0,
        label: "very-low"
      };
    }

    const validEvidence = evidence.filter(
      (item) =>
        item &&
        Number.isFinite(Number(item.reliability))
    );

    if (validEvidence.length === 0) {
      return {
        score: 0,
        percentage: 0,
        label: "very-low"
      };
    }

    const total = validEvidence.reduce(
      (sum, item) =>
        sum + this.normalize(item.reliability),
      0
    );

    const score = total / validEvidence.length;

    return {
      score: this.normalize(score),
      percentage: this.percentage(score),
      label: this.label(score)
    };
  }

  /**
   * Combine multiple confidence values.
   */
  combine(values = []) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        score: 0,
        percentage: 0,
        label: "very-low"
      };
    }

    const normalized = values.map((value) =>
      this.normalize(value)
    );

    const score =
      normalized.reduce(
        (sum, value) => sum + value,
        0
      ) / normalized.length;

    return {
      score,
      percentage: this.percentage(score),
      label: this.label(score)
    };
  }

  /**
   * Create a confidence result.
   */
  create(score, factors = {}) {
    const normalized = this.normalize(score);

    return {
      score: normalized,
      percentage: this.percentage(normalized),
      label: this.label(normalized),
      factors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Confidence;
