'use strict';

require('dotenv').config();

const EnvironmentValidator = require(
    '../src/config/EnvironmentValidator'
);

try {
    const result = EnvironmentValidator.validate();

    console.log('Environment validation passed.');
    console.log(`Application: ${result.appName}`);
    console.log(`Environment: ${result.environment}`);

    console.log(
        'Withdrawal maximum: unlimited at the application level.'
    );

    console.log(
        `Withdrawals enabled: ${result.withdrawalConfiguration.withdrawalsEnabled}`
    );

    console.log(
        `Monnify enabled: ${result.withdrawalConfiguration.monnifyEnabled}`
    );

    console.log(
        `Bank withdrawals enabled: ${result.withdrawalConfiguration.bankWithdrawalsEnabled}`
    );

    console.log('Secrets were not displayed.');
} catch (error) {
    console.error(
        `Environment validation failed: ${error.message}`
    );

    process.exitCode = 1;
}
