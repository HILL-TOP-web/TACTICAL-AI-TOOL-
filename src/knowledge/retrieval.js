// knowledge/retrieval.js

class RetrievalEngine {
  constructor(options = {}) {
    this.embeddingService =
      options.embeddingService;

    this.vectorStore =
      options.vectorStore;

    if (!this.embeddingService) {
      throw new Error(
        "embeddingService is required"
      );
    }

    if (!this.vectorStore) {
      throw new Error(
        "vectorStore is required"
      );
    }
  }

  async retrieve(query, options = {}) {
    if (!query || typeof query !== "string") {
      throw new Error(
        "A query is required"
      );
    }

    const queryEmbedding =
      await this.embeddingService.embed(query);

    const results =
      await this.vectorStore.search(
        queryEmbedding,
        {
          limit:
            options.limit ||
            options.topK ||
            10,
          minScore:
            options.minScore !== undefined
              ? options.minScore
              : 0
        }
      );

    return {
      query,
      results,
      count: results.length
    };
  }

  async retrieveByDocument(
    query,
    documentId,
    options = {}
  ) {
    const result =
      await this.retrieve(query, {
        ...options,
        limit: options.limit || 50
      });

    const filtered =
      result.results.filter(
        item =>
          item.documentId === documentId
      );

    return {
      ...result,
      results: filtered,
      count: filtered.length
    };
  }

  buildContext(results, options = {}) {
    const maxChunks =
      options.maxChunks || 5;

    return results
      .slice(0, maxChunks)
      .map((result, index) => {
        return [
          `[SOURCE ${index + 1}]`,
          `Document: ${result.metadata?.filename || "Unknown"}`,
          `Chunk: ${result.index ?? "Unknown"}`,
          `Relevance: ${result.score?.toFixed(4) || "N/A"}`,
          "",
          result.text,
          ""
        ].join("\n");
      })
      .join("\n");
  }
}

module.exports = RetrievalEngine;
