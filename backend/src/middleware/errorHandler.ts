import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    })
    return
  }

  // Log unexpected errors server-side only
  console.error('Unexpected error:', err)
  res.status(500).json({
    error: { message: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.' },
  })
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Ruta no encontrada.' } })
}
