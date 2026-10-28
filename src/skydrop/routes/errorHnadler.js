'use strict';

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error.name === 'ValidationError' ||
        error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data.'
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'A record with this reference already exists.'
        });
    }

    console.error('SkyDrop API error:', {
        method: req.method,
        path: req.path,
        message: error.message
    });

    return res.status(500).json({
        success: false,
        message: 'An internal server error occurred.'
    });
}

module.exports = errorHandler;
