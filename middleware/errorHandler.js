// Centralized error handler.
function errorHandler(err, req, res, next) {
  // Log full detail server-side for debugging, but never leak stack traces
  // or raw error internals to the client.
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  // Malformed JSON bodies from express.json() arrive here as SyntaxError
  // with a `status`/`statusCode` of 400 set by body-parser internally.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;