'use strict';

const WalletService = require('../services/WalletService');

async function getWallet(req, res, next) {
    try {
        const wallet = await WalletService.getWallet(req.user.id);

        return res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getWallet
};
