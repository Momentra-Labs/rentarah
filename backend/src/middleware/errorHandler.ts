import type { ErrorRequestHandler } from 'express'

import { HttpError } from '../lib/httpError.js'

/**
 * Global error handler — must be registered last with 4 parameters.
 * Converts {@link HttpError} to JSON; hides stack traces in production for unexpected errors.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return
  }

  const statusCode = err instanceof HttpError ? err.statusCode : 500
  const message = err instanceof HttpError ? err.message : 'Internal Server Error'
  const details = err instanceof HttpError ? err.details : undefined

  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    error: message,
    ...(details !== undefined ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' &&
      !(err instanceof HttpError) && { stack: err.stack }),
  })
}
