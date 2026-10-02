import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const attendanceRouter = Router()
attendanceRouter.use(authenticate)

// GET /api/attendance?courseId=&date=
attendanceRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, date, studentId } = req.query as Record<string, string>
    if (!courseId) throw new AppError('courseId es requerido.', 400)

    const course = await prisma.course.findFirst({ where: { id: courseId, teacherId: req.userId } })
    if (!course) throw new AppError('Curso no encontrado.', 404)

    const where: Record<string, unknown> = { courseId }
    if (date) where.date = new Date(date)
    if (studentId) where.studentId = studentId

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } } },
      orderBy: { date: 'desc' },
    })
    res.json({ data: records })
  } catch (err) { next(err) }
})

// POST /api/attendance/batch – Save a full attendance session
attendanceRouter.post('/batch', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, date, records } = req.body as {
      courseId: string
      date: string
      records: Array<{ studentId: string; status: string; note?: string }>
    }

    if (!courseId || !date || !records?.length) {
      throw new AppError('courseId, date y records son requeridos.', 400)
    }

    const course = await prisma.course.findFirst({ where: { id: courseId, teacherId: req.userId } })
    if (!course) throw new AppError('Curso no encontrado.', 404)

    const sessionDate = new Date(date)
    const validStatuses = ['PRESENT', 'LATE', 'ABSENT', 'JUSTIFIED']

    const ops = records.map((r) => {
      if (!validStatuses.includes(r.status.toUpperCase())) {
        throw new AppError(`Estado inválido: ${r.status}`, 400)
      }
      return prisma.attendance.upsert({
        where: { studentId_courseId_date: { studentId: r.studentId, courseId, date: sessionDate } },
        create: { studentId: r.studentId, courseId, date: sessionDate, status: r.status.toUpperCase() as never, note: r.note },
        update: { status: r.status.toUpperCase() as never, note: r.note },
      })
    })

    const result = await prisma.$transaction(ops)
    res.json({ data: result, message: '✓ Asistencia guardada correctamente.' })
  } catch (err) { next(err) }
})

// PUT /api/attendance/:id – Update single record
attendanceRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.attendance.findFirst({
      where: { id: req.params.id, course: { teacherId: req.userId } },
    })
    if (!existing) throw new AppError('Registro no encontrado.', 404)
    const record = await prisma.attendance.update({ where: { id: req.params.id }, data: req.body })
    res.json({ data: record })
  } catch (err) { next(err) }
})
