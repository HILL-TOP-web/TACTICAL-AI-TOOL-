'use strict';

class ExchangeController {
    constructor(options = {}) {
        this.exchangeService = options.exchangeService;
        this.validator = options.validator;

        if (
            !this.exchangeService ||
            typeof this.exchangeService.getRates !== 'function' ||
            typeof this.exchangeService.exchange !== 'function'
        ) {
            throw new TypeError(
                'A valid ExchangeService is required.'
            );
        }

        this.getRates = this.getRates.bind(this);
        this.exchange = this.exchange.bind(this);
        this.getStatus = this.getStatus.bind(this);
    }

    async getRates(req, res, next) {
        try {
            const rates = await this.exchangeService.getRates();

            return res.status(200).json({
                success: true,
                data: rates
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async exchange(req, res, next) {
        try {
            const userId = this._getUserId(req);

            const input = {
                userId,
                fromCurrency: req.body.fromCurrency,
                toCurrency: req.body.toCurrency,
                amount: req.body.amount,
                idempotencyKey:
                    req.get('Idempotency-Key') ||
                    req.body.idempotencyKey
            };

            if (this.validator) {
                const validation =
                    this.validator.validateExchange(input);

                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'Exchange validation failed.',
                        details: validation.errors
                    });
                }
            }

            const result =
                await this.exchangeService.exchange(input);

            return res.status(200).json({
                success: true,
                message: 'Exchange request processed.',
                data: result
            });
        } catch (error) {
            return this._handleError(error, res, next);
        }
    }

    async getStatus(req, res, next) {
        try {
            const userId = this._getUserId(req);

            if (
                typeof this.exchangeService.getStatus !==
                'function'
            ) {
                return res.status(501).json({
                    success: false,
                    error: 'Exchange status lookup is not configured.'
                });
            }

            const result =
                await this.exchangeService.getStatus({
                    userId,
                    exchangeId: req.params.exchangeId
                });

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Exchange record not found.'
                });
            }

            return res.status(200).json({
                success: true,
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

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Exchange operation failed.'
        });
    }
}

module.exports = ExchangeController;
