import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const coursesRouter = Router()
coursesRouter.use(authenticate)

// GET /api/courses
coursesRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany({
      where: { teacherId: req.userId },
      include: {
        enrollments: { select: { id: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: courses })
  } catch (err) { next(err) }
})

// GET /api/courses/:id
coursesRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findFirst({
      where: { id: req.params.id, teacherId: req.userId },
      include: { enrollments: { include: { student: true } } },
    })
    if (!course) throw new AppError('Curso no encontrado.', 404)
    res.json({ data: course })
  } catch (err) { next(err) }
})

// POST /api/courses
coursesRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, group, room, schedule, startDate, endDate } = req.body
    if (!name || !code || !group || !room || !schedule) {
      throw new AppError('Faltan campos requeridos.', 400)
    }
    const course = await prisma.course.create({
      data: {
        name, code, description, group, room, schedule,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        teacherId: req.userId!,
      },
    })
    res.status(201).json({ data: course, message: 'Curso creado exitosamente.' })
  } catch (err) { next(err) }
})

// PUT /api/courses/:id
coursesRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.course.findFirst({ where: { id: req.params.id, teacherId: req.userId } })
    if (!existing) throw new AppError('Curso no encontrado.', 404)
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { ...req.body, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, endDate: req.body.endDate ? new Date(req.body.endDate) : undefined },
    })
    res.json({ data: course, message: 'Curso actualizado.' })
  } catch (err) { next(err) }
})

// DELETE /api/courses/:id
coursesRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.course.findFirst({ where: { id: req.params.id, teacherId: req.userId } })
    if (!existing) throw new AppError('Curso no encontrado.', 404)
    await prisma.course.delete({ where: { id: req.params.id } })
    res.json({ message: 'Curso eliminado.' })
  } catch (err) { next(err) }
})
