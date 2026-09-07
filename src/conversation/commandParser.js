'use strict';

const COMMANDS = {
    briefing: [
        'brief',
        'briefing',
        'give briefing'
    ],

    situation: [
        'sitrep',
        'situation report',
        'situation'
    ],

    status: [
        'status',
        'status report',
        'system status'
    ],

    debrief: [
        'debrief',
        'after action',
        'after-action review',
        'aar'
    ],

    help: [
        'help',
        'commands',
        'options'
    ]
};

function normalize(text) {
    return String(text || '')
        .trim()
        .replace(/\s+/g, ' ');
}

function detectCommand(text) {
    const normalized = text.toLowerCase();

    for (const [command, aliases] of Object.entries(COMMANDS)) {
        for (const alias of aliases) {
            if (
                normalized === alias ||
                normalized.startsWith(`${alias} `)
            ) {
                return command;
            }
        }
    }

    return null;
}

function extractArguments(text, command) {
    if (!command) {
        return [];
    }

    const aliases = COMMANDS[command] || [];
    const lower = text.toLowerCase();

    for (const alias of aliases) {
        if (
            lower === alias ||
            lower.startsWith(`${alias} `)
        ) {
            return text
                .slice(alias.length)
                .trim()
                .split(/\s+/)
                .filter(Boolean);
        }
    }

    return [];
}

function parse(input) {
    const text = normalize(input);
    const command = detectCommand(text);
    const args = extractArguments(text, command);

    return {
        raw: input,
        text,
        command,
        arguments: args,
        isCommand: Boolean(command)
    };
}

module.exports = {
    COMMANDS,
    normalize,
    detectCommand,
    extractArguments,
    parse
};
