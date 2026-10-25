'use strict';

require('dotenv').config();

const EnvironmentValidator = require(
    '../src/skydrop/config/EnvironmentValidator'
);

try {
    const result = EnvironmentValidator.assertValid();

    console.log('SkyDrop environment check passed.');
    console.log(`Platform: ${result.platform}`);
    console.log(`Environment: ${result.environment}`);

    process.exitCode = 0;
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
