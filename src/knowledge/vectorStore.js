// knowledge/vectorStore.js

class VectorStore {
  constructor(options = {}) {
    this.embeddingService =
      options.embeddingService || null;

    this.vectors = new Map();
  }

  async add(item) {
    if (!item || !item.id) {
      throw new Error(
        "Vector item must contain an id"
      );
    }

    if (!Array.isArray(item.embedding)) {
      throw new Error(
        "Vector item must contain an embedding"
      );
    }

    this.vectors.set(item.id, {
      ...item,
      createdAt:
        item.createdAt || new Date().toISOString()
    });

    return this.vectors.get(item.id);
  }

  async addMany(items) {
    for (const item of items) {
      await this.add(item);
    }

    return items.length;
  }

  get(id) {
    return this.vectors.get(id) || null;
  }

  delete(id) {
    return this.vectors.delete(id);
  }

  clear() {
    this.vectors.clear();
  }

  size() {
    return this.vectors.size;
  }

  async search(queryEmbedding, options = {}) {
    if (!Array.isArray(queryEmbedding)) {
      throw new Error(
        "queryEmbedding must be an array"
      );
    }

    const limit = options.limit || 10;
    const minScore =
      options.minScore !== undefined
        ? options.minScore
        : -1;

    const results = [];

    for (const item of this.vectors.values()) {
      if (!Array.isArray(item.embedding)) {
        continue;
      }

      const score = this.cosineSimilarity(
        queryEmbedding,
        item.embedding
      );

      if (score < minScore) {
        continue;
      }

      results.push({
        ...item,
        score
      });
    }

    results.sort(
      (a, b) => b.score - a.score
    );

    return results.slice(0, limit);
  }

  cosineSimilarity(a, b) {
    const length = Math.min(
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
      (Math.sqrt(normA) *
        Math.sqrt(normB))
    );
  }

  export() {
    return Array.from(
      this.vectors.values()
    );
  }

  import(items) {
    if (!Array.isArray(items)) {
      throw new Error(
        "items must be an array"
      );
    }

    this.vectors.clear();

    for (const item of items) {
      this.vectors.set(item.id, item);
    }

    return this.size();
  }
}

module.exports = VectorStore;
