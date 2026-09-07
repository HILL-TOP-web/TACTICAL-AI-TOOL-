'use strict';

const weatherSchema = {
  type: 'object',

  required: [
    'timestamp'
  ],

  properties: {
    timestamp: {
      type: 'string'
    },

    temperature: {
      type: 'number'
    },

    humidity: {
      type: 'number'
    },

    pressure: {
      type: 'number'
    },

    windSpeed: {
      type: 'number'
    },

    windDirection: {
      type: 'number'
    },

    precipitation: {
      type: 'number'
    },

    visibility: {
      type: 'number'
    },

    conditions: {
      type: 'string'
    }
  }
};

module.exports = weatherSchema;
