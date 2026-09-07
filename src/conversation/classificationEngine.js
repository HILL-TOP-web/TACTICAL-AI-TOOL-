'use strict';

function generate(context = {}) {
    const intent = context.intent || {};
    const command = context.command || {};

    const questions = [];

    if (!command.text) {
        questions.push(
            'What would you like the Tactical AI to do?'
        );
    }

    if (
        intent.name === 'clarification' &&
        command.text
    ) {
        questions.push(
            'Would you like a briefing, situation report, status report, or training debrief?'
        );
    }

    return {
        title: 'CLARIFICATION REQUIRED',
        type: 'clarification',

        message: questions.length
            ? questions.join('\n')
            : 'Please provide additional information.',

        data: {
            detectedIntent: intent.name || 'unknown',
            confidence: intent.confidence ?? 0
        }
    };
}

module.exports = {
    generate
};
