import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const studentsRouter = Router()
studentsRouter.use(authenticate)

// Verify teacher owns the course
async function verifyCourseOwnership(courseId: string, teacherId: string) {
  const course = await prisma.course.findFirst({ where: { id: courseId, teacherId } })
  if (!course) throw new AppError('Curso no encontrado.', 404)
  return course
}

// GET /api/students?courseId=...
studentsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.query as { courseId?: string }
    if (courseId) {
      await verifyCourseOwnership(courseId, req.userId!)
      const students = await prisma.student.findMany({
        where: { enrollments: { some: { courseId } } },
        include: { enrollments: { where: { courseId } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      })
      res.json({ data: students })
    } else {
      // All students across teacher's courses
      const students = await prisma.student.findMany({
        where: { enrollments: { some: { course: { teacherId: req.userId } } } },
        include: { enrollments: { include: { course: { select: { id: true, name: true, group: true } } } } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      })
      res.json({ data: students })
    }
  } catch (err) { next(err) }
})

// GET /api/students/:id
studentsRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, enrollments: { some: { course: { teacherId: req.userId } } } },
      include: {
        enrollments: { include: { course: true } },
        grades: { include: { evaluation: true } },
        attendance: { orderBy: { date: 'desc' }, take: 60 },
      },
    })
    if (!student) throw new AppError('Estudiante no encontrado.', 404)
    res.json({ data: student })
  } catch (err) { next(err) }
})

// POST /api/students
studentsRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, studentId, email, phone, courseId } = req.body
    if (!firstName || !lastName || !studentId || !courseId) {
      throw new AppError('Faltan campos requeridos.', 400)
    }
    await verifyCourseOwnership(courseId, req.userId!)

    // Check duplicate studentId
    const duplicate = await prisma.student.findUnique({ where: { studentId } })
    if (duplicate) {
      // If student exists, just enroll them
      const alreadyEnrolled = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: duplicate.id, courseId } } })
      if (alreadyEnrolled) throw new AppError('El estudiante ya está inscrito en este curso.', 409)
      const enrollment = await prisma.enrollment.create({ data: { studentId: duplicate.id, courseId } })
      return res.status(201).json({ data: duplicate, message: 'Estudiante inscrito al curso.' })
    }

    const student = await prisma.student.create({
      data: { firstName, lastName, studentId, email, phone },
    })
    await prisma.enrollment.create({ data: { studentId: student.id, courseId } })
    res.status(201).json({ data: student, message: 'Estudiante registrado.' })
  } catch (err) { next(err) }
})

// PUT /api/students/:id
studentsRouter.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.student.findFirst({
      where: { id: req.params.id, enrollments: { some: { course: { teacherId: req.userId } } } },
    })
    if (!existing) throw new AppError('Estudiante no encontrado.', 404)
    const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body })
    res.json({ data: student })
  } catch (err) { next(err) }
})

// DELETE /api/students/:id?courseId=...
studentsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.query as { courseId?: string }
    if (courseId) {
      await verifyCourseOwnership(courseId, req.userId!)
      await prisma.enrollment.deleteMany({ where: { studentId: req.params.id, courseId } })
      res.json({ message: 'Estudiante retirado del curso.' })
    } else {
      const student = await prisma.student.findFirst({
        where: { id: req.params.id, enrollments: { some: { course: { teacherId: req.userId } } } },
      })
      if (!student) throw new AppError('Estudiante no encontrado.', 404)
      await prisma.student.delete({ where: { id: req.params.id } })
      res.json({ message: 'Estudiante eliminado.' })
    }
  } catch (err) { next(err) }
})
