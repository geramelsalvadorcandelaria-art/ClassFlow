import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'

export const reportsRouter = Router()
reportsRouter.use(authenticate)

// GET /api/reports/dashboard – Dashboard stats
reportsRouter.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.userId!

    const [coursesCount, studentsCount, alerts] = await Promise.all([
      prisma.course.count({ where: { teacherId, status: 'ACTIVE' } }),
      prisma.student.count({ where: { enrollments: { some: { course: { teacherId } } }, status: 'ACTIVE' } }),
      prisma.grade.groupBy({
        by: ['studentId'],
        where: { evaluation: { course: { teacherId } } },
        _avg: { score: true },
      }),
    ])

    const atRisk = alerts.filter((g) => (g._avg.score ?? 0) < 70).length
    const overallAvg = alerts.length
      ? alerts.reduce((s, g) => s + (g._avg.score ?? 0), 0) / alerts.length
      : 0

    // Today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayAtt = await prisma.attendance.groupBy({
      by: ['status'],
      where: { course: { teacherId }, date: today },
      _count: { status: true },
    })
    const totalToday = todayAtt.reduce((s, a) => s + a._count.status, 0)
    const presentToday = todayAtt.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).reduce((s, a) => s + a._count.status, 0)
    const todayAttRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0

    res.json({
      data: {
        totalCourses: coursesCount,
        totalStudents: studentsCount,
        todayAttendanceRate: todayAttRate,
        pendingExams: 0, // Future: count evaluations with missing grades
        overallAverage: Math.round(overallAvg * 10) / 10,
        atRiskStudents: atRisk,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/reports/course/:id – Course detailed stats
reportsRouter.get('/course/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findFirst({
      where: { id: req.params.id, teacherId: req.userId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                grades: { include: { evaluation: true } },
                attendance: { where: { courseId: req.params.id } },
              },
            },
          },
        },
        evaluations: true,
      },
    })
    if (!course) {
      res.status(404).json({ error: { message: 'Curso no encontrado.' } })
      return
    }
    res.json({ data: course })
  } catch (err) { next(err) }
})
