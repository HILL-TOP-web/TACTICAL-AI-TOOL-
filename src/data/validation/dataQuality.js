'use strict';

class DataQuality {
  assess(records) {
    if (!Array.isArray(records)) {
      throw new TypeError('Records must be an array');
    }

    if (records.length === 0) {
      return {
        total: 0,
        completeness: 1,
        duplicates: 0,
        qualityScore: 1
      };
    }

    let populatedFields = 0;
    let possibleFields = 0;

    const serialized = new Set();
    let duplicates = 0;

    for (const record of records) {
      const keys = Object.keys(record || {});

      for (const key of keys) {
        possibleFields++;

        if (
          record[key] !== null &&
          record[key] !== undefined &&
          record[key] !== ''
        ) {
          populatedFields++;
        }
      }

      const signature = JSON.stringify(record);

      if (serialized.has(signature)) {
        duplicates++;
      } else {
        serialized.add(signature);
      }
    }

    const completeness =
      possibleFields === 0
        ? 1
        : populatedFields / possibleFields;

    const duplicateRate = duplicates / records.length;

    const qualityScore =
      Math.max(
        0,
        completeness * (1 - duplicateRate)
      );

    return {
      total: records.length,
      completeness,
      duplicates,
      duplicateRate,
      qualityScore
    };
  }
}

module.exports = DataQuality;
