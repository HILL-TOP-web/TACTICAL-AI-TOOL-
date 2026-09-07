// ai/evaluation.js

class Evaluation {
  constructor(options = {}) {
    this.metrics =
      options.metrics || [
        "accuracy",
        "latency",
        "successRate"
      ];
  }

  evaluateClassification(
    predictions,
    labels
  ) {
    if (
      !Array.isArray(predictions) ||
      !Array.isArray(labels)
    ) {
      throw new Error(
        "predictions and labels must be arrays"
      );
    }

    if (
      predictions.length !==
      labels.length
    ) {
      throw new Error(
        "predictions and labels must have equal length"
      );
    }

    let correct = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (
        predictions[i] ===
        labels[i]
      ) {
        correct++;
      }
    }

    const accuracy =
      predictions.length
        ? correct /
          predictions.length
        : 0;

    return {
      total: predictions.length,
      correct,
      incorrect:
        predictions.length - correct,
      accuracy
    };
  }

  evaluateInference(results) {
    if (!Array.isArray(results)) {
      throw new Error(
        "results must be an array"
      );
    }

    const total =
      results.length;

    const successful =
      results.filter(
        result => result.success
      ).length;

    const failed =
      total - successful;

    const latencies =
      results
        .map(
          result =>
            Number(
              result.latencyMs
            ) || 0
        )
        .filter(
          value => value >= 0
        );

    const averageLatency =
      latencies.length
        ? latencies.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / latencies.length
        : 0;

    return {
      total,
      successful,
      failed,
      successRate:
        total
          ? successful / total
          : 0,
      averageLatencyMs:
        averageLatency,
      minLatencyMs:
        latencies.length
          ? Math.min(...latencies)
          : 0,
      maxLatencyMs:
        latencies.length
          ? Math.max(...latencies)
          : 0
    };
  }

  evaluateSimilarity(
    predicted,
    expected
  ) {
    if (
      typeof predicted !==
        "string" ||
      typeof expected !==
        "string"
    ) {
      throw new Error(
        "predicted and expected must be strings"
      );
    }

    const predictedTokens =
      new Set(
        this.tokenize(predicted)
      );

    const expectedTokens =
      new Set(
        this.tokenize(expected)
      );

    if (
      !predictedTokens.size ||
      !expectedTokens.size
    ) {
      return {
        precision: 0,
        recall: 0,
        f1: 0
      };
    }

    let overlap = 0;

    for (const token of predictedTokens) {
      if (
        expectedTokens.has(token)
      ) {
        overlap++;
      }
    }

    const precision =
      overlap /
      predictedTokens.size;

    const recall =
      overlap /
      expectedTokens.size;

    const f1 =
      precision + recall === 0
        ? 0
        : (
            2 *
            precision *
            recall
          ) /
          (precision + recall);

    return {
      precision,
      recall,
      f1
    };
  }

  evaluateBatch(dataset, evaluator) {
    if (!Array.isArray(dataset)) {
      throw new Error(
        "dataset must be an array"
      );
    }

    if (
      typeof evaluator !==
      "function"
    ) {
      throw new Error(
        "evaluator must be a function"
      );
    }

    const results = [];

    for (const item of dataset) {
      try {
        results.push({
          success: true,
          result: evaluator(item)
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: results.length,
      successful:
        results.filter(
          result => result.success
        ).length,
      failed:
        results.filter(
          result => !result.success
        ).length,
      results
    };
  }

  aggregate(metrics) {
    if (!Array.isArray(metrics)) {
      throw new Error(
        "metrics must be an array"
      );
    }

    const output = {};

    const keys =
      new Set();

    for (const metric of metrics) {
      Object.keys(metric).forEach(
        key => keys.add(key)
      );
    }

    for (const key of keys) {
      const values =
        metrics
          .map(metric =>
            Number(metric[key])
          )
          .filter(
            value =>
              Number.isFinite(value)
          );

      if (values.length) {
        output[key] =
          values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / values.length;
      }
    }

    return output;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        " "
      )
      .split(/\s+/)
      .filter(Boolean);
  }
}

module.exports = Evaluation;
