/**
 * Local Embedding Model
 * ---------------------
 * Lightweight deterministic text embedding.
 *
 * This is NOT a neural-network embedding model.
 * It provides a dependency-free interface that can later
 * be replaced with a real local embedding model.
 */

class EmbeddingModel {
  constructor(dimensions = 64) {
    this.dimensions = dimensions;
  }

  hash(text) {
    let hash = 2166136261;

    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return hash >>> 0;
  }

  embed(text) {
    const normalized = String(text || "")
      .toLowerCase()
      .trim();

    const vector = new Array(this.dimensions).fill(0);

    if (!normalized) {
      return vector;
    }

    const tokens = normalized.split(/\s+/);

    for (const token of tokens) {
      const hash = this.hash(token);

      const index = hash % this.dimensions;

      vector[index] += 1;
    }

    const magnitude = Math.sqrt(
      vector.reduce(
        (sum, value) => sum + value * value,
        0
      )
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(value =>
      Number((value / magnitude).toFixed(6))
    );
  }
}

module.exports = EmbeddingModel;
