'use strict';

const crypto = require('node:crypto');

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{8,128}$/;

function requestId(options = {}) {
    const headerName =
        options.headerName || 'x-request-id';

    const trustIncoming =
        options.trustIncoming === true;

    return function requestIdMiddleware(req, res, next) {
        let incomingId = req.get(headerName);

        if (
            !trustIncoming ||
            typeof incomingId !== 'string' ||
            !REQUEST_ID_PATTERN.test(incomingId)
        ) {
            incomingId = crypto.randomUUID();
        }

        req.requestId = incomingId;

        res.setHeader('X-Request-ID', incomingId);

        res.locals.requestId = incomingId;

        next();
    };
}

module.exports = requestId;
