const logger = require('../utils/logger');

function httpLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
}

module.exports = httpLogger;
