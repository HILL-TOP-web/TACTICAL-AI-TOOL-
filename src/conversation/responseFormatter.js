'use strict';

function normalizeResponse(response) {
    if (typeof response === 'string') {
        return {
            title: 'TACTICAL AI',
            message: response,
            type: 'conversation'
        };
    }

    if (!response || typeof response !== 'object') {
        return {
            title: 'SYSTEM',
            message: 'No response generated.',
            type: 'error'
        };
    }

    return {
        title: response.title || 'TACTICAL AI',
        message: response.message || '',
        type: response.type || 'conversation',
        data: response.data || null,
        timestamp: response.timestamp || new Date().toISOString()
    };
}

function format(response) {
    const normalized = normalizeResponse(response);

    return {
        ...normalized,
        display: buildDisplay(normalized)
    };
}

function buildDisplay(response) {
    const lines = [];

    lines.push(`[${response.title}]`);

    if (response.message) {
        lines.push(response.message);
    }

    if (response.data) {
        lines.push('');
        lines.push(JSON.stringify(response.data, null, 2));
    }

    return lines.join('\n');
}

module.exports = {
    normalizeResponse,
    buildDisplay,
    format
};
