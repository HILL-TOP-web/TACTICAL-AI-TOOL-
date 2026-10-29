'use strict';

require('dotenv').config();

const { connectMongo } = require('../../database/mongoose');
const withdrawalEngine = require('./WithdrawalEngine');

async function run() {
    await connectMongo();

    const results = await withdrawalEngine.reconcilePending({
        limit: 100
    });

    console.log(
        `SkyDrop withdrawal reconciliation checked ${results.length} record(s).`
    );

    return results;
}

if (require.main === module) {
    run()
        .then(async () => {
            const mongoose = require('../../database/mongoose').mongoose;
            await mongoose.disconnect();
            process.exitCode = 0;
        })
        .catch(async error => {
            console.error(
                'Withdrawal reconciliation failed:',
                error.message
            );

            const mongoose = require('../../database/mongoose').mongoose;

            await mongoose.disconnect().catch(() => {});

            process.exitCode = 1;
        });
}

module.exports = {
    run
};
