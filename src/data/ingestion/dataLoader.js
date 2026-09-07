'use strict';

const fs = require('fs/promises');
const path = require('path');

class DataLoader {
  constructor(options = {}) {
    this.encoding = options.encoding || 'utf8';
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024;
  }

  async load(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new TypeError('filePath must be a non-empty string');
    }

    const absolutePath = path.resolve(filePath);
    const stats = await fs.stat(absolutePath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }

    if (stats.size > this.maxFileSize) {
      throw new Error(
        `File exceeds maximum allowed size of ${this.maxFileSize} bytes`
      );
    }

    return fs.readFile(absolutePath, this.encoding);
  }

  async loadJSON(filePath) {
    const content = await this.load(filePath);

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
  }

  async exists(filePath) {
    try {
      await fs.access(path.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DataLoader;
