// knowledge/reranker.js

class Reranker {
  constructor(options = {}) {
    this.keywordWeight =
      options.keywordWeight ?? 0.35;

    this.semanticWeight =
      options.semanticWeight ?? 0.65;
  }

  rerank(query, results, options = {}) {
    if (!query) {
      return results || [];
    }

    const queryTokens =
      this.tokenize(query);

    const reranked =
      (results || []).map(result => {
        const keywordScore =
          this.keywordMatch(
            queryTokens,
            result.text || ""
          );

        const semanticScore =
          result.score || 0;

        const finalScore =
          semanticScore *
            this.semanticWeight +
          keywordScore *
            this.keywordWeight;

        return {
          ...result,
          keywordScore,
          semanticScore,
          rerankScore: finalScore
        };
      });

    reranked.sort(
      (a, b) =>
        b.rerankScore -
        a.rerankScore
    );

    const limit =
      options.limit || reranked.length;

    return reranked.slice(0, limit);
  }

  keywordMatch(queryTokens, text) {
    const textTokens =
      this.tokenize(text);

    if (!queryTokens.length) {
      return 0;
    }

    const textSet =
      new Set(textTokens);

    let matches = 0;

    for (const token of queryTokens) {
      if (textSet.has(token)) {
        matches++;
      }
    }

    return (
      matches / queryTokens.length
    );
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(token => token.length > 1);
  }
}

module.exports = Reranker;
