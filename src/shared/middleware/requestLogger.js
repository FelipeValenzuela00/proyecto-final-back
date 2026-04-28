
const requestLogger = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  const startTime = Date.now();

  // Interceptar cuando la respuesta se envía
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const sanitizedPath = String(req.path || '').replace(/[\r\n]/g, '');
    const log = `[${new Date().toISOString()}] ${req.method} ${sanitizedPath} - ${res.statusCode} - ${duration}ms`;
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