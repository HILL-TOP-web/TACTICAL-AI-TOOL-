'use strict';

const INTENTS = {
    greeting: [
        'hello',
        'hi',
        'hey',
        'good morning',
        'good afternoon'
    ],

    briefing: [
        'brief',
        'briefing',
        'prepare a briefing',
        'give me a briefing'
    ],

    situation_report: [
        'sitrep',
        'situation report',
        'what is the situation',
        'situation update'
    ],

    status_report: [
        'status',
        'status report',
        'system status',
        'current status'
    ],

    debrief: [
        'debrief',
        'after action',
        'after-action review',
        'review the exercise'
    ],

    terminology: [
        'what does',
        'meaning of',
        'define',
        'definition',
        'terminology'
    ],

    help: [
        'help',
        'commands',
        'what can you do'
    ]
};

function scoreIntent(text, keywords) {
    const normalized = text.toLowerCase();

    return keywords.reduce((score, keyword) => {
        return normalized.includes(keyword)
            ? score + keyword.length
            : score;
    }, 0);
}

function classify(text, context = {}) {
    const input = String(text || '').trim();

    if (!input) {
        return {
            name: 'clarification',
            confidence: 1,
            reason: 'Empty input'
        };
    }

    let bestIntent = 'unknown';
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(INTENTS)) {
        const score = scoreIntent(input, keywords);

        if (score > bestScore) {
            bestScore = score;
            bestIntent = intent;
        }
    }

    const confidence = Math.min(
        1,
        bestScore / 30
    );

    if (bestScore === 0) {
        return {
            name: 'clarification',
            confidence: 0,
            reason: 'No recognized intent',
            context
        };
    }

    return {
        name: bestIntent,
        confidence,
        reason: `Matched ${bestIntent}`,
        context
    };
}

module.exports = {
    INTENTS,
    classify
};
