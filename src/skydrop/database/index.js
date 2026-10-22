'use strict';

const DatabaseConnectionModule =
    require('./DatabaseConnection');

const TransactionRepository =
    require('./TransactionRepository');

const UserRepository =
    require('./UserRepository');

module.exports = {
    DatabaseConnection:
        DatabaseConnectionModule.DatabaseConnection,

    TransactionRepository,

    UserRepository,

    REQUIRED_DATABASE_VARIABLES:
        DatabaseConnectionModule.REQUIRED_DATABASE_VARIABLES,

    REQUIRED_MONNIFY_VARIABLES:
        DatabaseConnectionModule.REQUIRED_MONNIFY_VARIABLES,

    checkEnvironmentVariables:
        DatabaseConnectionModule.checkEnvironmentVariables,

    checkDatabaseEnvironment:
        DatabaseConnectionModule.checkDatabaseEnvironment,

    checkMonnifyEnvironment:
        DatabaseConnectionModule.checkMonnifyEnvironment,

    checkApplicationEnvironment:
        DatabaseConnectionModule.checkApplicationEnvironment,

    validateDatabaseUrl:
        DatabaseConnectionModule.validateDatabaseUrl
};
