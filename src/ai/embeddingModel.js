// ai/embeddingModel.js

const crypto = require("crypto");

class EmbeddingModel {
  constructor(options = {}) {
    this.dimensions =
      options.dimensions || 384;

    this.normalize =
      options.normalize !== false;

    this.provider =
      options.provider || "local";

    this.remoteEmbed =
      options.remoteEmbed || null;
  }

  async embed(text) {
    if (!text || typeof text !== "string") {
      throw new Error(
        "Text is required for embedding"
      );
    }

    if (
      this.provider === "remote" &&
      this.remoteEmbed
    ) {
      const vector =
        await this.remoteEmbed(text);

      return this.normalize
        ? this.normalizeVector(vector)
        : vector;
    }

    return this.localEmbedding(text);
  }

  async embedMany(texts) {
    if (!Array.isArray(texts)) {
      throw new Error(
        "texts must be an array"
      );
    }

    const vectors = [];

    for (const text of texts) {
      vectors.push(
        await this.embed(text)
      );
    }

    return vectors;
  }

  localEmbedding(text) {
    /*
     * Feature-hashing implementation.
     *
     * This is suitable for development and testing.
     * For production semantic search, replace it with
     * a trained embedding model.
     */

    const vector =
      new Array(this.dimensions).fill(0);

    const tokens =
      this.tokenize(text);

    for (const token of tokens) {
      const hash =
        crypto
          .createHash("sha256")
          .update(token)
          .digest();

      const index =
        hash.readUInt32BE(0) %
        this.dimensions;

      const sign =
        hash[4] % 2 === 0
          ? 1
          : -1;

      vector[index] += sign;
    }

    if (this.normalize) {
      return this.normalizeVector(vector);
    }

    return vector;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  normalizeVector(vector) {
    if (!Array.isArray(vector)) {
      throw new Error(
        "Embedding must be an array"
      );
    }

    const magnitude =
      Math.sqrt(
        vector.reduce(
          (sum, value) =>
            sum + value * value,
          0
        )
      );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(
      value => value / magnitude
    );
  }

  similarity(a, b) {
    if (
      !Array.isArray(a) ||
      !Array.isArray(b)
    ) {
      return 0;
    }

    const length =
      Math.min(
        a.length,
        b.length
      );

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }

    if (!normA || !normB) {
      return 0;
    }

    return (
      dot /
      (
        Math.sqrt(normA) *
        Math.sqrt(normB)
      )
    );
  }
}

module.exports = EmbeddingModel;
