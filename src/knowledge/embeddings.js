// knowledge/embeddings.js

const crypto = require("crypto");

class EmbeddingService {
  constructor(options = {}) {
    this.dimensions = options.dimensions || 384;
    this.provider = options.provider || "local";

    this.apiKey =
      options.apiKey ||
      process.env.EMBEDDING_API_KEY ||
      null;
  }

  async embed(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Text is required for embedding");
    }

    if (this.provider === "remote") {
      return this.remoteEmbedding(text);
    }

    return this.localEmbedding(text);
  }

  async embedMany(texts) {
    const embeddings = [];

    for (const text of texts) {
      embeddings.push(await this.embed(text));
    }

    return embeddings;
  }

  async remoteEmbedding(text) {
    if (!this.apiKey) {
      throw new Error(
        "EMBEDDING_API_KEY is required for remote embeddings"
      );
    }

    /*
     * Replace this method with your preferred embedding
     * provider's SDK/API call.
     *
     * The rest of the knowledge system does not need
     * to change.
     */

    throw new Error(
      "Remote embedding provider is not configured"
    );
  }

  localEmbedding(text) {
    /*
     * Deterministic feature-hashing embedding.
     *
     * This is useful for development/testing.
     * It is NOT equivalent to a neural embedding model.
     */

    const vector = new Array(this.dimensions).fill(0);

    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);

    for (const token of tokens) {
      const hash = crypto
        .createHash("sha256")
        .update(token)
        .digest();

      const index =
        hash.readUInt32BE(0) % this.dimensions;

      const sign =
        hash[4] % 2 === 0 ? 1 : -1;

      vector[index] += sign;
    }

    return this.normalizeVector(vector);
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(
      vector.reduce(
        (sum, value) => sum + value * value,
        0
      )
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(value => value / magnitude);
  }

  cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return 0;
    }

    const length = Math.min(a.length, b.length);

    let dot = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < length; i++) {
      dot += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    if (!magnitudeA || !magnitudeB) {
      return 0;
    }

    return (
      dot /
      (Math.sqrt(magnitudeA) *
        Math.sqrt(magnitudeB))
    );
  }
}

module.exports = EmbeddingService;
