'use strict';

const financeRoutes = require('./routes/financeRoutes');
const { errorHandler } = require('./utils/httpError');

function mountSkyDropApi(app, { authMiddleware } = {}) {
    if (!app || typeof app.use !== 'function') {
        throw new TypeError('An Express application is required');
    }

    if (authMiddleware) {
        app.use('/api', authMiddleware);
    }

    app.use('/api', financeRoutes);

    app.use(errorHandler);

    return app;
}

module.exports = {
    mountSkyDropApi
};
