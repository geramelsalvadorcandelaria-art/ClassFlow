import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const evaluationsRouter = Router()
evaluationsRouter.use(authenticate)

// GET /api/evaluations?courseId=
evaluationsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.query as { courseId?: string }
    const where = courseId
      ? { courseId, course: { teacherId: req.userId } }
      : { course: { teacherId: req.userId } }
    const evals = await prisma.evaluation.findMany({
      where,
      include: { _count: { select: { grades: true } } },
      orderBy: { date: 'asc' },
    })
    res.json({ data: evals })
  } catch (err) { next(err) }
})

// POST /api/evaluations
evaluationsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, name, type, date, description, maxScore, weight } = req.body
    if (!courseId || !name || !type || !date || !maxScore || weight === undefined) {
      throw new AppError('Faltan campos requeridos.', 400)
    }
    const course = await prisma.course.findFirst({ where: { id: courseId, teacherId: req.userId } })
    if (!course) throw new AppError('Curso no encontrado.', 404)
    if (weight < 0 || weight > 100) throw new AppError('El peso debe estar entre 0 y 100.', 400)

    const ev = await prisma.evaluation.create({
      data: { courseId, name, type: type.toUpperCase(), date: new Date(date), description, maxScore: Number(maxScore), weight: Number(weight) },
    })
    res.status(201).json({ data: ev, message: 'Evaluación creada.' })
  } catch (err) { next(err) }
})

// DELETE /api/evaluations/:id
evaluationsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ev = await prisma.evaluation.findFirst({ where: { id: req.params.id, course: { teacherId: req.userId } } })
    if (!ev) throw new AppError('Evaluación no encontrada.', 404)
    await prisma.evaluation.delete({ where: { id: req.params.id } })
    res.json({ message: 'Evaluación eliminada.' })
  } catch (err) { next(err) }
})

export const gradesRouter = Router()
gradesRouter.use(authenticate)

// GET /api/grades?courseId=&evaluationId=
gradesRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, evaluationId, studentId } = req.query as Record<string, string>
    const where: Record<string, unknown> = { evaluation: { course: { teacherId: req.userId } } }
    if (evaluationId) where.evaluationId = evaluationId
    if (studentId) where.studentId = studentId
    if (courseId) where.evaluation = { courseId, course: { teacherId: req.userId } }

    const grades = await prisma.grade.findMany({
      where,
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } }, evaluation: true },
    })
    res.json({ data: grades })
  } catch (err) { next(err) }
})

// POST /api/grades/batch
gradesRouter.post('/batch', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { evaluationId, grades } = req.body as { evaluationId: string; grades: Array<{ studentId: string; score: number; notes?: string }> }
    if (!evaluationId || !grades?.length) throw new AppError('evaluationId y grades son requeridos.', 400)

    const ev = await prisma.evaluation.findFirst({ where: { id: evaluationId, course: { teacherId: req.userId } } })
    if (!ev) throw new AppError('Evaluación no encontrada.', 404)

    for (const g of grades) {
      if (g.score < 0 || g.score > ev.maxScore) {
        throw new AppError(`Nota inválida (${g.score}). Debe estar entre 0 y ${ev.maxScore}.`, 400)
      }
    }

    const ops = grades.map((g) =>
      prisma.grade.upsert({
        where: { studentId_evaluationId: { studentId: g.studentId, evaluationId } },
        create: { studentId: g.studentId, evaluationId, score: g.score, notes: g.notes },
        update: { score: g.score, notes: g.notes },
      })
    )

    const result = await prisma.$transaction(ops)
    res.json({ data: result, message: '✓ Calificaciones guardadas.' })
  } catch (err) { next(err) }
})
