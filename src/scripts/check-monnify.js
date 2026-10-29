'use strict';

require('dotenv').config();

const {
    getMonnifyAccessToken
} = require('../src/skydrop/finance/banking/monnify/MonnifyAuth');

async function checkMonnify() {
    if (process.env.MONNIFY_ENABLED !== 'true') {
        throw new Error('Monnify is not enabled.');
    }

    if (
        process.env.MONNIFY_BASE_URL !==
        'https://api.monnify.com'
    ) {
        throw new Error(
            'Monnify must use the production base URL.'
        );
    }

    const required = [
        'MONNIFY_API_KEY',
        'MONNIFY_SECRET_KEY',
        'MONNIFY_CONTRACT_CODE'
    ];

    const missing = required.filter(
        key => !process.env[key]?.trim()
    );

    if (missing.length) {
        throw new Error(
            `Missing Monnify configuration: ${missing.join(', ')}`
        );
    }

    await getMonnifyAccessToken();

    console.log(
        'Monnify authentication succeeded.'
    );
}

if (require.main === module) {
    checkMonnify().catch(error => {
        console.error(
            `Monnify check failed: ${error.message}`
        );

        process.exitCode = 1;
    });
}

module.exports = {
    checkMonnify
};
