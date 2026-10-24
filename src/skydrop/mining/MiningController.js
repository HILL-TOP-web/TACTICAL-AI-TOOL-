'use strict';

class MiningController {
    constructor(miningService) {
        if (
            !miningService ||
            typeof miningService.start !== 'function'
        ) {
            throw new TypeError(
                'A valid MiningService instance is required.'
            );
        }

        this.miningService = miningService;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.status = this.status.bind(this);
        this.claim = this.claim.bind(this);
        this.setSpeed = this.setSpeed.bind(this);
    }

    async start(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.miningService.start(userId);

            return res.status(200).json({
                success: true,
                message: 'Mining session started or already active.',
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async stop(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.miningService.stop(userId);

            return res.status(200).json({
                success: true,
                message: 'Mining session stopped.',
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async status(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.miningService.getStatus(userId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async claim(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const result =
                await this.miningService.claim(userId);

            return res.status(200).json({
                success: true,
                message: 'Mining reward claimed.',
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async setSpeed(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const multiplier = Number(
                req.body && req.body.multiplier
            );

            const result =
                await this.miningService.setSpeed(
                    userId,
                    multiplier
                );

            return res.status(200).json({
                success: true,
                message: 'Mining multiplier updated.',
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    _getUserId(req) {
        const user = req.user;

        if (!user) {
            const error = new Error(
                'Authentication is required.'
            );

            error.statusCode = 401;

            throw error;
        }

        const userId = user.id || user.userId;

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

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Mining operation failed.'
        });
    }
}

module.exports = MiningController;
