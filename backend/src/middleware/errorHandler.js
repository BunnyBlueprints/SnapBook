const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ID format: ${err.value}` });
  }
  // Duplicate key (unique index)
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate entry' });
  }
  const status  = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') console.error(`[ERR] ${req.method} ${req.path}`, err.message);
  res.status(status).json({ success: false, message });
};

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });

module.exports = { errorHandler, notFound };
