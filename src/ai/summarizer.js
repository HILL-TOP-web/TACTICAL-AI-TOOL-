// ai/summarizer.js

class Summarizer {
  constructor(options = {}) {
    this.inference =
      options.inference || null;

    this.maxSentences =
      options.maxSentences || 5;

    this.maxInputLength =
      options.maxInputLength || 12000;
  }

  async summarize(text, options = {}) {
    if (!text || typeof text !== "string") {
      throw new Error(
        "Text is required for summarization"
      );
    }

    const input =
      text.slice(0, this.maxInputLength);

    if (this.inference) {
      return this.modelSummary(
        input,
        options
      );
    }

    return this.extractiveSummary(
      input,
      options
    );
  }

  async modelSummary(text, options) {
    const prompt = `
Summarize the following text accurately.

Requirements:
- Preserve important facts.
- Do not invent information.
- Remove repetition.
- Keep important qualifications.
- Use clear and concise language.

Text:
${text}
`.trim();

    const result =
      await this.inference.runStrict(
        prompt,
        options
      );

    return {
      summary: result.text.trim(),
      method: "model",
      sourceLength: text.length
    };
  }

  extractiveSummary(text, options = {}) {
    const maxSentences =
      options.maxSentences ||
      this.maxSentences;

    const sentences =
      this.splitSentences(text);

    if (
      sentences.length <= maxSentences
    ) {
      return {
        summary: sentences.join(" "),
        method: "extractive",
        sourceLength: text.length
      };
    }

    const frequency =
      this.wordFrequency(text);

    const scored =
      sentences.map(
        (sentence, index) => ({
          sentence,
          index,
          score:
            this.sentenceScore(
              sentence,
              frequency
            )
        })
      );

    scored.sort(
      (a, b) => b.score - a.score
    );

    const selected =
      scored
        .slice(0, maxSentences)
        .sort(
          (a, b) =>
            a.index - b.index
        )
        .map(item => item.sentence);

    return {
      summary: selected.join(" "),
      method: "extractive",
      sourceLength: text.length
    };
  }

  splitSentences(text) {
    return text
      .match(
        /[^.!?]+[.!?]+|[^.!?]+$/g
      )
      ?.map(sentence =>
        sentence.trim()
      )
      .filter(Boolean) || [];
  }

  wordFrequency(text) {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "to",
      "of",
      "in",
      "on",
      "for",
      "with",
      "as",
      "by",
      "at",
      "from",
      "this",
      "that",
      "it"
    ]);

    const frequency = {};

    const words =
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/);

    for (const word of words) {
      if (
        !word ||
        stopWords.has(word)
      ) {
        continue;
      }

      frequency[word] =
        (frequency[word] || 0) + 1;
    }

    return frequency;
  }

  sentenceScore(sentence, frequency) {
    const words =
      sentence
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
      return 0;
    }

    let score = 0;

    for (const word of words) {
      score += frequency[word] || 0;
    }

    return score / words.length;
  }
}

module.exports = Summarizer;
