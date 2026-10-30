'use strict';

const crypto = require('node:crypto');

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);

        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

function errorHandler(logger = console) {
    return function handleError(err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }

        const requestId =
            req.requestId ||
            crypto.randomUUID();

        const statusCode =
            Number.isInteger(err.statusCode) &&
            err.statusCode >= 400 &&
            err.statusCode <= 599
                ? err.statusCode
                : 500;

        const code = err.code || 'INTERNAL_ERROR';

        const isProduction =
            process.env.NODE_ENV === 'production';

        const safeMessage =
            statusCode >= 500
                ? 'An internal server error occurred.'
                : err.message || 'Request failed.';

        const logData = {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            code,
            timestamp: new Date().toISOString()
        };

        if (statusCode >= 500) {
            logger.error?.('SkyDrop application error', {
                ...logData,
                error: err.message,
                stack: isProduction ? undefined : err.stack
            });
        } else {
            logger.warn?.('SkyDrop request rejected', logData);
        }

        return res.status(statusCode).json({
            success: false,
            error: {
                code,
                message: safeMessage,
                requestId,
                ...(err.details && statusCode < 500
                    ? { details: err.details }
                    : {}),
                ...(!isProduction && err.stack
                    ? { stack: err.stack }
                    : {})
            }
        });
    };
}

module.exports = {
    AppError,
    errorHandler
};
