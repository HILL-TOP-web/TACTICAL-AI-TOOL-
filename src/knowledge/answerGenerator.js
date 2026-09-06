// knowledge/answerGenerator.js

class AnswerGenerator {
  constructor(options = {}) {
    this.model =
      options.model || null;

    this.maxContextLength =
      options.maxContextLength || 8000;
  }

  async generate(query, context, options = {}) {
    if (!query) {
      throw new Error(
        "Query is required"
      );
    }

    const cleanContext =
      this.truncateContext(
        context || ""
      );

    if (this.model) {
      return this.generateWithModel(
        query,
        cleanContext,
        options
      );
    }

    return this.generateExtractive(
      query,
      cleanContext
    );
  }

  async generateWithModel(
    query,
    context,
    options
  ) {
    /*
     * The model adapter should expose:
     *
     *   model.generate(prompt, options)
     *
     * This keeps the knowledge layer independent
     * from a specific AI provider.
     */

    if (
      typeof this.model.generate !==
      "function"
    ) {
      throw new Error(
        "Configured model must expose generate()"
      );
    }

    const prompt =
      this.buildPrompt(
        query,
        context
      );

    const response =
      await this.model.generate(
        prompt,
        options
      );

    return {
      answer:
        typeof response === "string"
          ? response
          : response.text || "",
      query,
      grounded: true,
      generatedAt:
        new Date().toISOString()
    };
  }

  generateExtractive(
    query,
    context
  ) {
    const sentences =
      context
        .split(/[.!?]\s+/)
        .map(sentence =>
          sentence.trim()
        )
        .filter(Boolean);

    const queryTerms =
      this.tokenize(query);

    const scored =
      sentences.map(sentence => ({
        sentence,
        score:
          this.scoreSentence(
            sentence,
            queryTerms
          )
      }));

    scored.sort(
      (a, b) =>
        b.score - a.score
    );

    const selected =
      scored
        .filter(item => item.score > 0)
        .slice(0, 5)
        .map(item => item.sentence);

    const answer =
      selected.length
        ? selected.join(". ") + "."
        : "I could not find enough relevant information in the supplied knowledge context.";

    return {
      answer,
      query,
      grounded: true,
      mode: "extractive",
      generatedAt:
        new Date().toISOString()
    };
  }

  buildPrompt(query, context) {
    return `
You are a knowledge-grounded assistant.

Answer the user's question using only the supplied context.

User question:
${query}

Knowledge context:
${context}

Rules:
- Do not invent facts.
- If the context does not contain enough information, say so.
- Prefer precise, concise answers.
- Preserve important qualifications and uncertainty.
- Do not claim that information exists in the context if it does not.
`.trim();
  }

  scoreSentence(sentence, queryTerms) {
    const sentenceTerms =
      new Set(
        this.tokenize(sentence)
      );

    if (!queryTerms.length) {
      return 0;
    }

    let matches = 0;

    for (const term of queryTerms) {
      if (sentenceTerms.has(term)) {
        matches++;
      }
    }

    return (
      matches / queryTerms.length
    );
  }

  tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(
        token => token.length > 2
      );
  }

  truncateContext(context) {
    if (
      context.length <=
      this.maxContextLength
    ) {
      return context;
    }

    return context.slice(
      0,
      this.maxContextLength
    );
  }
}

module.exports = AnswerGenerator;
