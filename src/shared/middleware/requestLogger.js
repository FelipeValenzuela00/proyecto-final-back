
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Interceptar cuando la respuesta se envía
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const sanitizedPath = String(req.path || '').replace(/[\r\n]/g, '');
    const log = `[${new Date().toISOString()}] ${req.method} ${sanitizedPath} - ${res.statusCode} - ${duration}ms`;
    console.log(log);
  });

  next();
};

module.exports = requestLogger;