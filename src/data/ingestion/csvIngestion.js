'use strict';

class CSVIngestion {
  constructor(options = {}) {
    this.delimiter = options.delimiter || ',';
    this.trimValues = options.trimValues !== false;
  }

  parse(csv) {
    if (typeof csv !== 'string') {
      throw new TypeError('CSV input must be a string');
    }

    const lines = csv
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return [];
    }

    const headers = this.parseLine(lines[0]);

    return lines.slice(1).map(line => {
      const values = this.parseLine(line);
      const record = {};

      headers.forEach((header, index) => {
        record[header] = values[index] ?? null;
      });

      return record;
    });
  }

  parseLine(line) {
    const values = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }

        continue;
      }

      if (char === this.delimiter && !insideQuotes) {
        values.push(this.clean(current));
        current = '';
        continue;
      }

      current += char;
    }

    values.push(this.clean(current));

    return values;
  }

  clean(value) {
    return this.trimValues ? value.trim() : value;
  }
}

module.exports = CSVIngestion;
