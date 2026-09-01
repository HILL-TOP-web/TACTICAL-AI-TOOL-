/**
 * Decision Engine
 *
 * Evaluates candidate actions inside a controlled
 * fictional/training simulation.
 */

class DecisionEngine {
  constructor(options = {}) {
    this.confidence = options.confidence || null;
    this.eventBus = options.eventBus || null;
    this.auditLogger = options.auditLogger || null;

    this.minimumScore =
      Number(options.minimumScore ?? 0);

    this.maximumCandidates =
      Number(options.maximumCandidates ?? 20);
  }

  /**
   * Evaluate a collection of candidate decisions.
   */
  evaluate(context = {}, candidates = []) {
    if (!Array.isArray(candidates)) {
      throw new TypeError(
        "candidates must be an array"
      );
    }

    const limitedCandidates =
      candidates.slice(0, this.maximumCandidates);

    const evaluated = limitedCandidates.map(
      (candidate, index) => {
        return this.evaluateCandidate(
          context,
          candidate,
          index
        );
      }
    );

    evaluated.sort(
      (a, b) => b.score - a.score
    );

    const result = {
      selected:
        evaluated.length > 0
          ? evaluated[0]
          : null,

      candidates: evaluated,

      timestamp: new Date().toISOString()
    };

    this.emit("decision:evaluated", result);

    this.audit(
      "decision_evaluation",
      {
        candidateCount: evaluated.length,
        selected:
          result.selected?.id || null
      }
    );

    return result;
  }

  /**
   * Evaluate one candidate.
   */
  evaluateCandidate(context, candidate, index) {
    if (!candidate || typeof candidate !== "object") {
      throw new TypeError(
        "Each candidate must be an object"
      );
    }

    const factors = this.calculateFactors(
      context,
      candidate
    );

    const score = this.calculateScore(factors);

    const confidence =
      this.calculateConfidence(factors);

    return {
      id:
        candidate.id ||
        `candidate-${index + 1}`,

      action:
        candidate.action ||
        "unspecified",

      description:
        candidate.description ||
        "",

      score,

      factors,

      confidence,

      assumptions:
        Array.isArray(candidate.assumptions)
          ? [...candidate.assumptions]
          : [],

      risks:
        Array.isArray(candidate.risks)
          ? [...candidate.risks]
          : []
    };
  }

  /**
   * Calculate generic simulation factors.
   *
   * Values should be between 0 and 1.
   */
  calculateFactors(context, candidate) {
    return {
      objectiveFit: this.normalize(
        candidate.objectiveFit ?? 0.5
      ),

      resourceEfficiency: this.normalize(
        candidate.resourceEfficiency ?? 0.5
      ),

      timeEfficiency: this.normalize(
        candidate.timeEfficiency ?? 0.5
      ),

      riskScore: this.normalize(
        candidate.riskScore ?? 0.5
      ),

      informationQuality: this.normalize(
        context.informationQuality ?? 0.5
      ),

      environmentalSuitability: this.normalize(
        candidate.environmentalSuitability ?? 0.5
      )
    };
  }

  /**
   * Calculate overall score.
   *
   * Higher riskScore means greater simulated risk,
   * therefore it is inverted in the final score.
   */
  calculateScore(factors) {
    const score =
      factors.objectiveFit * 0.25 +
      factors.resourceEfficiency * 0.15 +
      factors.timeEfficiency * 0.15 +
      (1 - factors.riskScore) * 0.20 +
      factors.informationQuality * 0.15 +
      factors.environmentalSuitability * 0.10;

    return Math.round(
      this.normalize(score) * 100
    );
  }

  /**
   * Calculate confidence in the evaluation.
   */
  calculateConfidence(factors) {
    const values = [
      factors.informationQuality,
      factors.environmentalSuitability,
      factors.objectiveFit
    ];

    if (this.confidence) {
      return this.confidence.combine(values);
    }

    const score =
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length;

    return {
      score,
      percentage: Math.round(score * 100),
      label:
        score >= 0.85
          ? "high"
          : score >= 0.60
            ? "moderate"
            : score >= 0.35
              ? "low"
              : "very-low"
    };
  }

  /**
   * Normalize a numerical value.
   */
  normalize(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(0, number)
    );
  }

  emit(event, data) {
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    }
  }

  audit(event, data) {
    if (this.auditLogger) {
      this.auditLogger.log(event, data);
    }
  }
}

module.exports = DecisionEngine;
