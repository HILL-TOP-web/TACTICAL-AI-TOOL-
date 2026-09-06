// knowledge/documentParser.js

class DocumentParser {
  parse(document) {
    if (!document || typeof document.content !== "string") {
      throw new Error("Invalid document");
    }

    const extension = document.extension;

    switch (extension) {
      case ".json":
        return this.parseJSON(document);

      case ".csv":
        return this.parseCSV(document);

      case ".md":
        return this.parseMarkdown(document);

      case ".txt":
      default:
        return this.parseText(document);
    }
  }

  parseText(document) {
    return {
      documentId: document.id,
      title: document.filename,
      text: this.normalize(document.content),
      metadata: {
        filename: document.filename,
        path: document.path,
        type: "text"
      }
    };
  }

  parseMarkdown(document) {
    let text = document.content;

    text = text.replace(/```[\s\S]*?```/g, " ");
    text = text.replace(/`([^`]+)`/g, "$1");
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    text = text.replace(/^#{1,6}\s*/gm, "");

    return {
      documentId: document.id,
      title: document.filename,
      text: this.normalize(text),
      metadata: {
        filename: document.filename,
        path: document.path,
        type: "markdown"
      }
    };
  }

  parseJSON(document) {
    let parsed;

    try {
      parsed = JSON.parse(document.content);
    } catch (error) {
      throw new Error(
        `Invalid JSON document: ${error.message}`
      );
    }

    const text = this.flattenJSON(parsed);

    return {
      documentId: document.id,
      title: document.filename,
      text: this.normalize(text),
      metadata: {
        filename: document.filename,
        path: document.path,
        type: "json"
      }
    };
  }

  parseCSV(document) {
    const lines = document.content
      .split(/\r?\n/)
      .filter(Boolean);

    if (lines.length === 0) {
      return {
        documentId: document.id,
        title: document.filename,
        text: "",
        metadata: {
          filename: document.filename,
          path: document.path,
          type: "csv"
        }
      };
    }

    const headers = this.parseCSVLine(lines[0]);

    const rows = lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);

      return headers
        .map((header, index) => `${header}: ${values[index] || ""}`)
        .join("; ");
    });

    return {
      documentId: document.id,
      title: document.filename,
      text: this.normalize(rows.join("\n")),
      metadata: {
        filename: document.filename,
        path: document.path,
        type: "csv",
        columns: headers
      }
    };
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === "," && !quoted) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());

    return result;
  }

  flattenJSON(value, prefix = "") {
    if (value === null || value === undefined) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return prefix
        ? `${prefix}: ${value}`
        : String(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((item, index) =>
          this.flattenJSON(
            item,
            `${prefix}[${index}]`
          )
        )
        .join("\n");
    }

    return Object.entries(value)
      .map(([key, item]) =>
        this.flattenJSON(
          item,
          prefix ? `${prefix}.${key}` : key
        )
      )
      .join("\n");
  }

  normalize(text) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

module.exports = DocumentParser;
