
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  const errorLog = `[${new Date().toISOString()}] ERROR - ${status} - ${message} - ${req.method} ${req.path}`;
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