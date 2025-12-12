// middlewares/errorHandler.js
export default (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
