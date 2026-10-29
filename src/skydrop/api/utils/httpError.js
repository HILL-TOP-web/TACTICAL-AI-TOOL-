'use strict';

class HttpError extends Error {
    constructor(status, code, message = code) {
        super(message);

        this.name = 'HttpError';
        this.status = status;
        this.code = code;
    }
}

function asyncHandler(handler) {
    return function wrappedHandler(req, res, next) {
        Promise.resolve(
            handler(req, res, next)
        ).catch(next);
    };
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const status = Number.isInteger(error.status)
        ? error.status
        : 500;

    if (status >= 500) {
        console.error('[SkyDrop API]', error.message);
    }

    return res.status(status).json({
        success: false,
        error: status >= 500
            ? 'internal-server-error'
            : (error.code || 'request-failed')
    });
}

module.exports = {
    HttpError,
    asyncHandler,
    errorHandler
};
