// ai/inference.js

class InferenceEngine {
  constructor(options = {}) {
    this.modelManager = options.modelManager;

    if (!this.modelManager) {
      throw new Error(
        "modelManager is required"
      );
    }

    this.defaultOptions = {
      temperature: 0.2,
      maxTokens: 512,
      ...options.defaultOptions
    };

    this.timeout =
      options.timeout || 30000;
  }

  async run(prompt, options = {}) {
    if (!prompt || typeof prompt !== "string") {
      throw new Error(
        "A non-empty prompt is required"
      );
    }

    const config = {
      ...this.defaultOptions,
      ...options
    };

    const startedAt = Date.now();

    try {
      const result = await this.withTimeout(
        this.modelManager.generate(
          prompt,
          config
        ),
        this.timeout
      );

      const latency =
        Date.now() - startedAt;

      return {
        text: this.extractText(result),
        raw: result,
        model:
          config.model ||
          this.modelManager.defaultModel,
        latencyMs: latency,
        success: true
      };
    } catch (error) {
      return {
        text: "",
        raw: null,
        model:
          config.model ||
          this.modelManager.defaultModel,
        latencyMs:
          Date.now() - startedAt,
        success: false,
        error: error.message
      };
    }
  }

  async runStrict(prompt, options = {}) {
    const result =
      await this.run(prompt, options);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  }

  async batch(prompts, options = {}) {
    if (!Array.isArray(prompts)) {
      throw new Error(
        "prompts must be an array"
      );
    }

    const results = [];

    for (const prompt of prompts) {
      results.push(
        await this.run(prompt, options)
      );
    }

    return results;
  }

  extractText(result) {
    if (typeof result === "string") {
      return result;
    }

    if (!result) {
      return "";
    }

    if (typeof result.text === "string") {
      return result.text;
    }

    if (typeof result.output === "string") {
      return result.output;
    }

    if (
      result.message &&
      typeof result.message.content === "string"
    ) {
      return result.message.content;
    }

    return "";
  }

  withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Inference timed out after ${timeoutMs}ms`
            )
          );
        }, timeoutMs);
      })
    ]);
  }
}

module.exports = InferenceEngine;
