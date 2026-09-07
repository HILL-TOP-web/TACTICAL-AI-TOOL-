// ai/classifier.js

class Classifier {
  constructor(options = {}) {
    this.inference =
      options.inference || null;

    this.categories =
      options.categories || [];

    this.confidenceThreshold =
      options.confidenceThreshold ?? 0.5;
  }

  setCategories(categories) {
    if (!Array.isArray(categories)) {
      throw new Error(
        "categories must be an array"
      );
    }

    this.categories = categories;
  }

  async classify(text, options = {}) {
    if (!text || typeof text !== "string") {
      throw new Error(
        "Text is required for classification"
      );
    }

    if (!this.categories.length) {
      throw new Error(
        "No classification categories configured"
      );
    }

    /*
     * If an inference engine is available, use it.
     * Otherwise use the deterministic keyword
     * classifier below.
     */

    if (this.inference) {
      return this.classifyWithModel(
        text,
        options
      );
    }

    return this.classifyWithKeywords(text);
  }

  async classifyWithModel(text, options) {
    const prompt = this.buildPrompt(text);

    const result =
      await this.inference.runStrict(
        prompt,
        options
      );

    const parsed =
      this.parseModelOutput(result.text);

    if (!parsed.category) {
      return this.classifyWithKeywords(text);
    }

    return {
      text,
      category: parsed.category,
      confidence:
        this.clamp(
          Number(parsed.confidence) || 0,
          0,
          1
        ),
      method: "model"
    };
  }

  classifyWithKeywords(text) {
    const normalized =
      text.toLowerCase();

    const scores = {};

    for (const category of this.categories) {
      const keywords =
        Array.isArray(category.keywords)
          ? category.keywords
          : [];

      let score = 0;

      for (const keyword of keywords) {
        if (
          normalized.includes(
            String(keyword).toLowerCase()
          )
        ) {
          score++;
        }
      }

      scores[category.name] = score;
    }

    const ranked =
      Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);

    const best = ranked[0];

    if (!best || best[1] === 0) {
      return {
        text,
        category: "unknown",
        confidence: 0,
        method: "keyword"
      };
    }

    const total =
      ranked.reduce(
        (sum, [, score]) => sum + score,
        0
      );

    const confidence =
      total > 0
        ? best[1] / total
        : 0;

    return {
      text,
      category: best[0],
      confidence,
      method: "keyword"
    };
  }

  buildPrompt(text) {
    const categoryNames =
      this.categories
        .map(category => category.name)
        .join(", ");

    return `
Classify the following text into exactly one category.

Categories:
${categoryNames}

Text:
${text}

Return JSON only:

{
  "category": "category_name",
  "confidence": 0.0
}
`.trim();
  }

  parseModelOutput(output) {
    try {
      return JSON.parse(output);
    } catch (_) {
      const match =
        output.match(/\{[\s\S]*\}/);

      if (!match) {
        return {};
      }

      try {
        return JSON.parse(match[0]);
      } catch (_) {
        return {};
      }
    }
  }

  clamp(value, min, max) {
    return Math.min(
      Math.max(value, min),
      max
    );
  }
}

module.exports = Classifier;
