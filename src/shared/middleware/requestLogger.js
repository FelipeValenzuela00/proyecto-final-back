const { sanitizeForLog } = require('../utils/sanitize');

const requestLogger = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  const startTime = Date.now();

  // Interceptar cuando la respuesta se envía
  res.once('finish', () => {
    const duration = Date.now() - startTime;
    const safePath = sanitizeForLog(req.path || '');
    const safeMethod = sanitizeForLog(req.method);
    const log = `[${new Date().toISOString()}] ${safeMethod} ${safePath} - ${res.statusCode} - ${duration}ms`;
    if (res.statusCode >= 500) {
      console.error(log);
    } else if (res.statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });

  next();
};

module.exports = requestLogger;
