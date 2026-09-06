// knowledge/citation.js

class CitationManager {
  constructor() {
    this.sources = new Map();
  }

  registerSource(source) {
    if (!source || !source.id) {
      throw new Error(
        "Source must contain an id"
      );
    }

    this.sources.set(source.id, {
      ...source,
      registeredAt:
        new Date().toISOString()
    });

    return this.sources.get(source.id);
  }

  registerSources(sources) {
    for (const source of sources) {
      this.registerSource(source);
    }

    return sources.length;
  }

  createCitation(result, index = 1) {
    if (!result) {
      return null;
    }

    const metadata =
      result.metadata || {};

    return {
      id: `citation-${index}`,
      sourceId:
        result.documentId ||
        result.id,
      document:
        metadata.filename ||
        metadata.title ||
        "Unknown source",
      chunk:
        result.index ?? null,
      score:
        result.rerankScore ??
        result.score ??
        null,
      text:
        result.text || ""
    };
  }

  createCitations(results) {
    return (results || []).map(
      (result, index) =>
        this.createCitation(
          result,
          index + 1
        )
    );
  }

  formatCitation(citation) {
    if (!citation) {
      return "";
    }

    const document =
      citation.document ||
      "Unknown source";

    const chunk =
      citation.chunk !== null
        ? `, chunk ${citation.chunk}`
        : "";

    return `[${citation.id}] ${document}${chunk}`;
  }

  formatCitationList(citations) {
    return (citations || [])
      .map(citation =>
        this.formatCitation(citation)
      )
      .join("\n");
  }

  attachCitations(answer, citations) {
    return {
      answer,
      citations: citations || [],
      generatedAt:
        new Date().toISOString()
    };
  }
}

module.exports = CitationManager;
