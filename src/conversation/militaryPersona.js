'use strict';

const responseTemplates = require('./responseTemplates');

const militaryPersona = {
    name: 'TACTICAL-AI',

    greeting() {
        return 'Tactical AI online. Ready to process training, simulation, planning, and reporting requests.';
    },

    identity() {
        return {
            name: this.name,
            role: 'Training and simulation assistant',
            mode: 'Fictional / training',
            capabilities: [
                'Situation analysis',
                'Training briefings',
                'Status reporting',
                'Scenario debriefing',
                'Command interpretation',
                'Terminology assistance'
            ]
        };
    },

    respond(input, context = {}) {
        const normalized = String(input).toLowerCase();

        if (
            normalized.includes('who are you') ||
            normalized.includes('what are you')
        ) {
            return {
                title: 'SYSTEM IDENTITY',
                message:
                    'I am Tactical AI, a training and simulation assistant designed to organize information, interpret structured commands, and generate analytical reports.',
                type: 'identity'
            };
        }

        if (
            normalized.includes('capabilities') ||
            normalized.includes('what can you do')
        ) {
            return {
                title: 'CAPABILITIES',
                message: responseTemplates.capabilities(),
                type: 'capabilities'
            };
        }

        return {
            title: 'ACKNOWLEDGED',
            message:
                `Request received: "${input}". ` +
                'No specialized intent was detected. Please provide a clearer training, simulation, reporting, or analysis request.',
            type: 'general'
        };
    }
};

module.exports = militaryPersona;
