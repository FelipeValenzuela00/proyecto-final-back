const logger = require('../utils/logger');
const { sanitizeForLog } = require('../utils/sanitize');

const requestLogger = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  const startTime = Date.now();

  res.once('finish', () => {
    const duration = Date.now() - startTime;
    const safePath = sanitizeForLog(req.path || '');
    const safeMethod = sanitizeForLog(req.method);
    const meta = {
      method: safeMethod,
      path: safePath,
      status: res.statusCode,
      durationMs: duration,
    };
    const message = `${safeMethod} ${safePath} - ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
};

module.exports = requestLogger;
