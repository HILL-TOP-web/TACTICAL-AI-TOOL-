'use strict';

const eventSchema = {
  type: 'object',

  required: [
    'id',
    'type',
    'timestamp'
  ],

  properties: {
    id: {
      type: 'string'
    },

    type: {
      type: 'string'
    },

    timestamp: {
      type: 'string'
    },

    source: {
      type: 'string'
    },

    description: {
      type: 'string'
    },

    confidence: {
      type: 'number'
    },

    data: {
      type: 'object'
    }
  }
};

module.exports = eventSchema;
