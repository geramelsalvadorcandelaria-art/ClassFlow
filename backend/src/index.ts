import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { authRouter } from './routes/auth'
import { coursesRouter } from './routes/courses'
import { studentsRouter } from './routes/students'
import { attendanceRouter } from './routes/attendance'
import { evaluationsRouter } from './routes/evaluations'
import { gradesRouter } from './routes/grades'
import { reportsRouter } from './routes/reports'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ClassFlow API' })
})

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/students', studentsRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/evaluations', evaluationsRouter)
app.use('/api/grades', gradesRouter)
app.use('/api/reports', reportsRouter)

// ─── Serve Frontend in Production ─────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next()
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next()
  })
})

// ─── Error handlers ────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 ClassFlow API running on http://localhost:${PORT}`)
  console.log(`📚 Environment: ${process.env.NODE_ENV}`)
})

export default app
