// knowledge/documentLoader.js

const fs = require("fs/promises");
const path = require("path");

class DocumentLoader {
  constructor(options = {}) {
    this.supportedExtensions = options.supportedExtensions || [
      ".txt",
      ".md",
      ".json",
      ".csv"
    ];
  }

  async load(filePath) {
    if (!filePath) {
      throw new Error("filePath is required");
    }

    const absolutePath = path.resolve(filePath);
    const extension = path.extname(absolutePath).toLowerCase();

    if (!this.supportedExtensions.includes(extension)) {
      throw new Error(
        `Unsupported document type: ${extension || "unknown"}`
      );
    }

    const stats = await fs.stat(absolutePath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }

    const content = await fs.readFile(absolutePath, "utf8");

    return {
      id: this.createDocumentId(absolutePath),
      path: absolutePath,
      filename: path.basename(absolutePath),
      extension,
      size: stats.size,
      content,
      loadedAt: new Date().toISOString()
    };
  }

  async loadDirectory(directoryPath, recursive = true) {
    const absoluteDirectory = path.resolve(directoryPath);

    const files = await this.collectFiles(
      absoluteDirectory,
      recursive
    );

    const documents = [];

    for (const file of files) {
      try {
        const document = await this.load(file);
        documents.push(document);
      } catch (error) {
        console.warn(
          `Skipping ${file}: ${error.message}`
        );
      }
    }

    return documents;
  }

  async collectFiles(directory, recursive) {
    const entries = await fs.readdir(directory, {
      withFileTypes: true
    });

    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory() && recursive) {
        const nested = await this.collectFiles(
          fullPath,
          recursive
        );

        files.push(...nested);
        continue;
      }

      if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();

        if (this.supportedExtensions.includes(extension)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  createDocumentId(filePath) {
    return Buffer.from(filePath)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 64);
  }
}

module.exports = DocumentLoader;
