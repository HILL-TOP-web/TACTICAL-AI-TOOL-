'use strict';

function error(message) {
    return {
        title: 'SYSTEM ERROR',
        type: 'error',
        message
    };
}

function help() {
    return [
        'Available commands:',
        '',
        '• briefing — generate a training briefing',
        '• situation report — generate a SITREP',
        '• status — display system status',
        '• debrief — generate an after-action review',
        '• terminology — explain a military/training term',
        '• help — display available commands',
        '',
        'The system operates as a training and simulation assistant.'
    ].join('\n');
}

function capabilities() {
    return [
        '1. Conversation processing',
        '2. Command parsing',
        '3. Intent classification',
        '4. Training briefings',
        '5. Situation reporting',
        '6. System status reporting',
        '7. Exercise debriefing',
        '8. Terminology lookup',
        '9. Conversation memory',
        '10. Structured response formatting'
    ].join('\n');
}

function acknowledgment() {
    return 'Request received and processed.';
}

function unavailable(feature) {
    return `${feature || 'Requested capability'} is not currently available in this module.`;
}

module.exports = {
    error,
    help,
    capabilities,
    acknowledgment,
    unavailable
};
