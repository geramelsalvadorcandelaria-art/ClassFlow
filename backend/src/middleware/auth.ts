import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('No autorizado. Token requerido.', 401, 'UNAUTHORIZED'))
    return
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_SECRET
  if (!secret) {
    next(new AppError('Configuración de servidor inválida.', 500))
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string }
    req.userId = decoded.userId
    next()
  } catch {
    next(new AppError('Token inválido o expirado.', 401, 'INVALID_TOKEN'))
  }
}
