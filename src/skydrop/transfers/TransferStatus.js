'use strict';

const TransferStatus = Object.freeze({
    CREATED: 'CREATED',

    PENDING: 'PENDING',

    IN_PROGRESS: 'IN_PROGRESS',

    SUCCESS: 'SUCCESS',

    FAILED: 'FAILED',

    REVERSED: 'REVERSED'
});

const TERMINAL_STATUSES = new Set([
    TransferStatus.SUCCESS,
    TransferStatus.FAILED,
    TransferStatus.REVERSED
]);

function isTerminalStatus(status) {
    return TERMINAL_STATUSES.has(status);
}

module.exports = {
    TransferStatus,
    isTerminalStatus
};
