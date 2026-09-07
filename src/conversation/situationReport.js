'use strict';

function classifyReadiness(status) {
    const value = String(status || '').toLowerCase();

    if (
        value.includes('critical') ||
        value.includes('failed')
    ) {
        return 'CRITICAL';
    }

    if (
        value.includes('warning') ||
        value.includes('degraded')
    ) {
        return 'DEGRADED';
    }

    return 'NORMAL';
}

function generate(context = {}) {
    const situation = context.situation || {};
    const entities = situation.entities || [];
    const events = situation.events || [];

    const readiness = classifyReadiness(
        situation.status
    );

    return {
        title: 'SITUATION REPORT',
        type: 'situation_report',

        message: [
            `Overall status: ${readiness}`,
            `Summary: ${situation.summary || 'No situation summary available.'}`,
            '',
            `Tracked entities: ${entities.length}`,
            `Recorded events: ${events.length}`,
            '',
            'Assessment:',
            situation.assessment ||
                'Insufficient information for a detailed assessment.'
        ].join('\n'),

        data: {
            readiness,
            summary: situation.summary || null,
            entities,
            events,
            assessment: situation.assessment || null
        }
    };
}

module.exports = {
    generate,
    classifyReadiness
};
