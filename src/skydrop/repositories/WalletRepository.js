'use strict';

const Wallet = require('../database/models/Wallet');
const { HttpError } = require('../api/utils/httpError');

class WalletRepository {
    async getByUserId(userId, session) {
        let query = Wallet.findOne({ userId });

        if (session) {
            query = query.session(session);
        }

        const wallet = await query;

        if (!wallet) {
            throw new HttpError(404, 'wallet-not-found');
        }

        return wallet;
    }

    async ensureForUser(userId, session) {
        let query = Wallet.findOne({ userId });

        if (session) {
            query = query.session(session);
        }

        let wallet = await query;

        if (wallet) {
            return wallet;
        }

        try {
            const options = session ? { session } : {};

            const created = await Wallet.create(
                [{ userId }],
                options
            );

            return created[0];
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }

            let retry = Wallet.findOne({ userId });

            if (session) {
                retry = retry.session(session);
            }

            wallet = await retry;

            if (!wallet) {
                throw error;
            }

            return wallet;
        }
    }
}

module.exports = new WalletRepository();
