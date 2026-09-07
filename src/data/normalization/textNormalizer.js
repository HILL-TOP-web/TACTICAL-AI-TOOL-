'use strict';

class TextNormalizer {
  normalize(text) {
    if (text === null || text === undefined) {
      return '';
    }

    return String(text)
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  lowercase(text) {
    return this.normalize(text).toLowerCase();
  }

  removeControlCharacters(text) {
    return this.normalize(text).replace(/[\u0000-\u001F\u007F]/g, '');
  }

  normalizeForSearch(text) {
    return this.removeControlCharacters(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = TextNormalizer;
