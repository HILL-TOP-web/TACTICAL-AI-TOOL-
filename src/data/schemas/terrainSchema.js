'use strict';

const terrainSchema = {
  type: 'object',

  required: [
    'type'
  ],

  properties: {
    type: {
      type: 'string'
    },

    elevation: {
      type: 'number'
    },

    latitude: {
      type: 'number'
    },

    longitude: {
      type: 'number'
    },

    slope: {
      type: 'number'
    },

    surface: {
      type: 'string'
    },

    vegetation: {
      type: 'string'
    },

    accessibility: {
      type: 'number'
    }
  }
};

module.exports = terrainSchema;
