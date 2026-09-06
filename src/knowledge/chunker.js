// knowledge/chunker.js

class Chunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 800;
    this.overlap = options.overlap || 120;

    if (this.overlap >= this.chunkSize) {
      throw new Error(
        "overlap must be smaller than chunkSize"
      );
    }
  }

  chunk(document) {
    if (!document || !document.text) {
      return [];
    }

    const paragraphs = document.text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    const chunks = [];
    let current = "";

    for (const paragraph of paragraphs) {
      if (
        current.length + paragraph.length + 1 <=
        this.chunkSize
      ) {
        current +=
          (current ? "\n\n" : "") + paragraph;
        continue;
      }

      if (current) {
        chunks.push(current);
      }

      if (paragraph.length > this.chunkSize) {
        const pieces = this.splitLongText(paragraph);

        chunks.push(...pieces.slice(0, -1));

        current = pieces[pieces.length - 1] || "";
      } else {
        current = paragraph;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks.map((text, index) => ({
      id: `${document.documentId}-chunk-${index}`,
      documentId: document.documentId,
      index,
      text,
      metadata: {
        ...document.metadata,
        chunkIndex: index
      }
    }));
  }

  splitLongText(text) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(
        start + this.chunkSize,
        text.length
      );

      let splitAt = end;

      if (end < text.length) {
        const sentenceBreak = text.lastIndexOf(
          ". ",
          end
        );

        const wordBreak = text.lastIndexOf(
          " ",
          end
        );

        if (
          sentenceBreak > start + this.chunkSize * 0.5
        ) {
          splitAt = sentenceBreak + 1;
        } else if (
          wordBreak > start + this.chunkSize * 0.5
        ) {
          splitAt = wordBreak;
        }
      }

      chunks.push(text.slice(start, splitAt).trim());

      start = Math.max(
        splitAt - this.overlap,
        start + 1
      );
    }

    return chunks;
  }
}

module.exports = Chunker;
