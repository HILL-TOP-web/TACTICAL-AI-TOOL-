'use strict';

const EventEmitter = require('events');
const FileIngestion = require('./fileIngestion');
const JSONIngestion = require('./jsonIngestion');
const CSVIngestion = require('./csvIngestion');

class IngestionManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.fileIngestion =
      options.fileIngestion || new FileIngestion(options);

    this.jsonIngestion =
      options.jsonIngestion || new JSONIngestion(options);

    this.csvIngestion =
      options.csvIngestion || new CSVIngestion(options);
  }

  async ingestFile(filePath) {
    try {
      const data = await this.fileIngestion.ingest(filePath);

      this.emit('ingested', {
        source: filePath,
        data
      });

      return data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  ingestJSON(input) {
    const data = this.jsonIngestion.parse(input);

    this.emit('ingested', {
      source: 'json',
      data
    });

    return data;
  }

  ingestCSV(input) {
    const data = this.csvIngestion.parse(input);

    this.emit('ingested', {
      source: 'csv',
      data
    });

    return data;
  }
}

module.exports = IngestionManager;
