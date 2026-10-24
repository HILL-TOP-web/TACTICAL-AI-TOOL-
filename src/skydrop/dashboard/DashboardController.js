'use strict';

class DashboardController {
    constructor(dashboardService) {
        if (
            !dashboardService ||
            typeof dashboardService.getDashboard !== 'function'
        ) {
            throw new TypeError(
                'A valid DashboardService is required.'
            );
        }

        this.dashboardService = dashboardService;

        this.getDashboard = this.getDashboard.bind(this);
        this.getSummary = this.getSummary.bind(this);
        this.getStats = this.getStats.bind(this);
        this.getTransactions = this.getTransactions.bind(this);
    }

    async getDashboard(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.dashboardService.getDashboard(userId);

            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async getSummary(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.dashboardService.getSummary(userId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async getStats(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.dashboardService.getStats(userId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const limit = Number(req.query.limit ?? 10);
            const offset = Number(req.query.offset ?? 0);

            if (
                !Number.isInteger(limit) ||
                limit < 1 ||
                limit > 100
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Limit must be between 1 and 100.'
                });
            }

            if (
                !Number.isInteger(offset) ||
                offset < 0
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Offset must be a non-negative integer.'
                });
            }

            const result =
                await this.dashboardService.getTransactions(
                    userId,
                    { limit, offset }
                );

            return res.status(200).json({
                success: true,
                count: result.length,
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    _getUserId(req) {
        if (!req.user) {
            const error = new Error(
                'Authentication is required.'
            );

            error.statusCode = 401;
            throw error;
        }

        const userId = req.user.id || req.user.userId;

        if (
            userId === undefined ||
            userId === null ||
            String(userId).trim() === ''
        ) {
            const error = new Error(
                'Authenticated user ID is missing.'
            );

            error.statusCode = 401;
            throw error;
        }

        return String(userId);
    }

    _handleError(error, res, next) {
        if (
            typeof next === 'function' &&
            (!error.statusCode || error.statusCode >= 500)
        ) {
            return next(error);
        }

        return res
            .status(error.statusCode || 400)
            .json({
                success: false,
                error: error.message ||
                    'Dashboard request failed.'
            });
    }
}

module.exports = DashboardController;
