
const sanitizeForLog = (value) => String(value).replace(/[\r\n]/g, '');

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const safeMethod = sanitizeForLog(req.method);
  const safePath = sanitizeForLog(req.path);
  const safeMessage = sanitizeForLog(message);
  
  const errorLog = `[${new Date().toISOString()}] ERROR - ${status} - ${safeMessage} - ${safeMethod} ${safePath}`;
  console.error(errorLog);

  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = errorHandler;