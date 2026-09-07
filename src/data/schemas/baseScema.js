'use strict';

const baseSchema = {
  type: 'object',

  properties: {
    id: {
      type: 'string'
    },

    timestamp: {
      type: 'string'
    },

    source: {
      type: 'string'
    },

    confidence: {
      type: 'number'
    }
  }
};

module.exports = baseSchema;
