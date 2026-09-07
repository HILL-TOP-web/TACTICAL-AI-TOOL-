'use strict';

function generate(context = {}) {
    const mission = context.mission || {};
    const environment = context.environment || {};
    const objectives = context.objectives || [];

    const objectiveList = objectives.length
        ? objectives.map((item, index) => `${index + 1}. ${item}`)
        : 'No objectives supplied.';

    return {
        title: 'TRAINING BRIEFING',
        type: 'briefing',

        message: [
            'Training briefing generated.',
            '',
            `Scenario: ${mission.name || 'Unnamed scenario'}`,
            `Purpose: ${mission.purpose || 'Training and simulation'}`,
            `Environment: ${environment.description || 'Not specified'}`,
            '',
            'Objectives:',
            objectiveList,
            '',
            'Assessment focus:',
            'Decision quality, communication, situational awareness, and adherence to exercise constraints.'
        ].join('\n'),

        data: {
            scenario: mission.name || null,
            purpose: mission.purpose || null,
            environment,
            objectives
        }
    };
}

module.exports = {
    generate
};
