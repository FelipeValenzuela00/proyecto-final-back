
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Interceptar cuando la respuesta se envía
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
    console.log(log);
  });

  next();
};

module.exports = requestLogger;