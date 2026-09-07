'use strict';

function calculateScore(metrics = {}) {
    const values = Object.values(metrics)
        .filter(value => typeof value === 'number');

    if (!values.length) {
        return null;
    }

    const total = values.reduce(
        (sum, value) => sum + value,
        0
    );

    return Number(
        (total / values.length).toFixed(2)
    );
}

function generate(context = {}) {
    const exercise = context.exercise || {};
    const metrics = context.metrics || {};
    const observations = context.observations || [];

    const score = calculateScore(metrics);

    return {
        title: 'AFTER-ACTION DEBRIEF',
        type: 'debrief',

        message: [
            `Exercise: ${exercise.name || 'Unnamed exercise'}`,
            `Outcome: ${exercise.outcome || 'Not specified'}`,
            '',
            `Performance score: ${score ?? 'Not available'}`,
            '',
            'Observations:',
            observations.length
                ? observations.map(
                    (item, index) =>
                        `${index + 1}. ${item}`
                ).join('\n')
                : 'No observations recorded.',
            '',
            'Training recommendation:',
            'Review observed strengths and weaknesses before repeating the exercise.'
        ].join('\n'),

        data: {
            exercise,
            metrics,
            score,
            observations
        }
    };
}

module.exports = {
    generate,
    calculateScore
};
