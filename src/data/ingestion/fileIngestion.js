'use strict';

const path = require('path');
const DataLoader = require('./dataLoader');

class FileIngestion {
  constructor(options = {}) {
    this.loader = options.loader || new DataLoader(options);
  }

  async ingest(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case '.json':
        return this.loader.loadJSON(filePath);

      case '.txt':
        return this.loader.load(filePath);

      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  getSupportedExtensions() {
    return ['.json', '.txt'];
  }
}

module.exports = FileIngestion;
