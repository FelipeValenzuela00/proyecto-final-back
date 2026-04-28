
const sanitizeForLog = (value) => String(value).replace(/[\r\n]/g, '');

const errorHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    return _next(err);
  }
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const timestamp = new Date().toISOString();
  const safeMethod = sanitizeForLog(req.method);
  const safePath = sanitizeForLog(req.path);
  const safeMessage = sanitizeForLog(message);

  const errorLog = `[${timestamp}] ERROR - ${status} - ${safeMessage} - ${safeMethod} ${safePath}`;
  console.error(errorLog);
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: {
      status,
      message: status >= 500 ? 'Internal Server Error' : message,
      timestamp,
    },
  });
};

module.exports = errorHandler;