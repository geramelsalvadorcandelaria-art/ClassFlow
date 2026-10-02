import { Router, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import type { Request } from 'express'

export const authRouter = Router()

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string }

    if (!name || !email || !password) {
      throw new AppError('Nombre, email y contraseña son requeridos.', 400)
    }
    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new AppError('Ya existe una cuenta con este email.', 409, 'EMAIL_TAKEN')
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12')
    const passwordHash = await bcrypt.hash(password, rounds)

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    )

    res.status(201).json({ data: { user, token } })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos.', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new AppError('Credenciales inválidas.', 401, 'INVALID_CREDENTIALS')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new AppError('Credenciales inválidas.', 401, 'INVALID_CREDENTIALS')
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    )

    const { passwordHash: _, ...safeUser } = user
    res.json({ data: { user: safeUser, token } })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
import { authenticate, type AuthRequest } from '../middleware/auth'
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) throw new AppError('Usuario no encontrado.', 404)
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})
