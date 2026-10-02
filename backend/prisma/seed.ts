import { PrismaClient, CourseStatus, StudentStatus, AttendanceStatus, EvaluationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ClassFlow database...')

  // Clean existing data
  await prisma.grade.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.course.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()

  // ─── Teacher ───────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 12)
  const teacher = await prisma.user.create({
    data: {
      name: 'Prof. García',
      email: 'profesor@classflow.com',
      passwordHash,
      role: 'TEACHER',
    },
  })
  console.log('✓ Teacher created:', teacher.email)

  // ─── Courses ──────────────────────────────────────────────
  const coursesData = [
    { name: 'Desarrollo Web', code: 'DW-101', group: 'A-01', room: '204', schedule: 'Lun/Mié/Vie 8:00-9:30', description: 'Fundamentos de desarrollo web moderno' },
    { name: 'Bases de Datos', code: 'BD-201', group: 'B-01', room: '301', schedule: 'Mar/Jue 10:00-12:00', description: 'Diseño y administración de bases de datos' },
    { name: 'Algoritmos y Programación', code: 'AP-102', group: 'C-02', room: '105', schedule: 'Lun/Mié 14:00-16:00', description: 'Fundamentos de algoritmia' },
    { name: 'Redes y Comunicaciones', code: 'RC-301', group: 'D-01', room: '210', schedule: 'Vie 8:00-12:00', description: 'Principios de redes de computadoras' },
  ]

  const courses = await Promise.all(coursesData.map((c) =>
    prisma.course.create({
      data: { ...c, teacherId: teacher.id, startDate: new Date('2026-08-01'), endDate: new Date('2026-12-15'), status: CourseStatus.ACTIVE },
    })
  ))
  console.log(`✓ ${courses.length} courses created`)

  // ─── Students ─────────────────────────────────────────────
  const firstNames = ['Ana', 'Carlos', 'María', 'Luis', 'Sofía', 'Pedro', 'Laura', 'Miguel', 'Valentina', 'Diego',
    'Isabella', 'Juan', 'Camila', 'Andrés', 'Natalia', 'Ricardo', 'Paula', 'Sebastián', 'Gabriela', 'Felipe']
  const lastNames = ['García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez',
    'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez', 'Cruz', 'Ortiz', 'Castillo', 'Vargas']

  let studentCounter = 1
  for (const course of courses) {
    const count = 20
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[(i + studentCounter) % firstNames.length]
      const lastName = lastNames[(i * 2 + studentCounter) % lastNames.length]
      const studentIdStr = `2026-${course.code.replace('-', '')}-${String(i + 1).padStart(3, '0')}`

      try {
        const student = await prisma.student.create({
          data: {
            firstName,
            lastName,
            studentId: studentIdStr,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@edu.classflow.com`,
            status: i < 18 ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
          },
        })
        await prisma.enrollment.create({ data: { studentId: student.id, courseId: course.id } })
      } catch {
        // Skip duplicate
      }
    }
    studentCounter += count
  }
  console.log(`✓ Students created and enrolled`)

  // ─── Evaluations ──────────────────────────────────────────
  const evalData = [
    { name: 'Examen', type: EvaluationType.EXAM, period: 'P1', weight: 40, maxScore: 100 },
    { name: 'Tareas', type: EvaluationType.TASK, period: 'P1', weight: 30, maxScore: 100 },
    { name: 'Participación', type: EvaluationType.PARTICIPATION, period: 'P1', weight: 15, maxScore: 100 },
    { name: 'Actitudes', type: EvaluationType.OTHER, period: 'P1', weight: 15, maxScore: 100 },
  ]

  for (const course of courses) {
    const evals = await Promise.all(evalData.map((e, i) =>
      prisma.evaluation.create({
        data: { courseId: course.id, ...e, date: new Date(`2026-09-${10 + i * 5}`) },
      })
    ))

    // Grades for first 3 evaluations
    const students = await prisma.student.findMany({
      where: { enrollments: { some: { courseId: course.id } }, status: StudentStatus.ACTIVE },
    })

    for (const student of students) {
      for (const ev of evals.slice(0, 3)) {
        const base = 60 + Math.random() * 35
        await prisma.grade.create({
          data: { studentId: student.id, evaluationId: ev.id, score: Math.min(100, Math.round(base)) },
        })
      }
    }
  }
  console.log(`✓ Evaluations and grades created`)

  // ─── Attendance (last 15 days) ─────────────────────────────
  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT, AttendanceStatus.JUSTIFIED,
  ]

  for (const course of courses) {
    const students = await prisma.student.findMany({
      where: { enrollments: { some: { courseId: course.id } }, status: StudentStatus.ACTIVE },
    })

    for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      date.setHours(0, 0, 0, 0)
      if (date.getDay() === 0 || date.getDay() === 6) continue // skip weekends

      for (const student of students) {
        const status = statuses[(students.indexOf(student) + daysAgo) % statuses.length]
        try {
          await prisma.attendance.create({ data: { studentId: student.id, courseId: course.id, date, status } })
        } catch {
          // Skip duplicates
        }
      }
    }
  }
  console.log(`✓ Attendance records created`)

  console.log('\n✅ Database seeded successfully!')
  console.log('🔑 Login: profesor@classflow.com / demo1234')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
