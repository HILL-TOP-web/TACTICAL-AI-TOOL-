'use strict';

const DashboardService = require('../services/DashboardService');

async function getDashboard(req, res, next) {
    try {
        const dashboard = await DashboardService.getDashboard(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getDashboard
};
