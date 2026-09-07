'use strict';

const entitySchema = {
  type: 'object',

  required: [
    'id',
    'type'
  ],

  properties: {
    id: {
      type: 'string'
    },

    type: {
      type: 'string'
    },

    name: {
      type: 'string'
    },

    latitude: {
      type: 'number'
    },

    longitude: {
      type: 'number'
    },

    confidence: {
      type: 'number'
    },

    attributes: {
      type: 'object'
    }
  }
};

module.exports = entitySchema;
