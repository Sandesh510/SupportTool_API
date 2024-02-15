module.exports = (err, req, res, next) => {
  console.error(err);

  // Set status code based on error type
  const statusCode = err.status || 500;

  // Send error message as JSON
  res.status(statusCode).json({ message: err.message });
};
