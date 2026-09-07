'use strict';

const TERMS = {
    sitrep: {
        term: 'SITREP',
        meaning: 'Situation Report',
        description:
            'A concise report describing the current state of a scenario or exercise.'
    },

    aar: {
        term: 'AAR',
        meaning: 'After-Action Review',
        description:
            'A structured review used to evaluate performance after a training event or simulation.'
    },

    briefing: {
        term: 'Briefing',
        meaning: 'Briefing',
        description:
            'A structured presentation of relevant information, objectives, constraints, and expectations.'
    },

    roe: {
        term: 'ROE',
        meaning: 'Rules of Engagement',
        description:
            'Defined constraints governing actions within a scenario. In this system they are treated as simulation or training constraints.'
    },

    opord: {
        term: 'OPORD',
        meaning: 'Operations Order',
        description:
            'A structured order format commonly used to communicate an organized plan.'
    }
};

function normalize(term) {
    return String(term || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim();
}

function explain(input) {
    const normalized = normalize(input);

    for (const [key, value] of Object.entries(TERMS)) {
        if (
            normalized.includes(key) ||
            normalized.includes(value.term.toLowerCase()) ||
            normalized.includes(value.meaning.toLowerCase())
        ) {
            return {
                title: `TERMINOLOGY: ${value.term}`,
                type: 'terminology',
                message:
                    `${value.term} — ${value.meaning}\n\n${value.description}`,
                data: value
            };
        }
    }

    return {
        title: 'TERMINOLOGY',
        type: 'terminology',
        message:
            'The requested term was not found in the local terminology dictionary.',
        data: {
            availableTerms: Object.keys(TERMS)
        }
    };
}

function addTerm(key, definition) {
    if (!key || !definition) {
        throw new Error(
            'A term key and definition are required.'
        );
    }

    TERMS[normalize(key)] = {
        term: definition.term || key,
        meaning: definition.meaning || '',
        description: definition.description || ''
    };
}

module.exports = {
    TERMS,
    normalize,
    explain,
    addTerm
};
