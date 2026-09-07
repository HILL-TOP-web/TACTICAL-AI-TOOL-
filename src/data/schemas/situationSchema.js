'use strict';

const situationSchema = {
  type: 'object',

  required: [
    'id',
    'timestamp'
  ],

  properties: {
    id: {
      type: 'string'
    },

    timestamp: {
      type: 'string'
    },

    entities: {
      type: 'array'
    },

    events: {
      type: 'array'
    },

    terrain: {
      type: 'object'
    },

    weather: {
      type: 'object'
    },

    confidence: {
      type: 'number'
    },

    uncertainty: {
      type: 'number'
    },

    metadata: {
      type: 'object'
    }
  }
};

module.exports = situationSchema;
