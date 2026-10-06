const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// MySQL Connection Pool
let pool = null

function getPool() {
  if (pool) return pool

  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    pool = mysql.createPool(dbUrl)
    return pool
  }

  // Fallback to standard BanaHosting env or defaults
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'zsonbkvb_Geramel5010v',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zsonbkvb_classflow',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
  })
  return pool
}

// Initialize tables if needed
async function initDB() {
  try {
    const p = getPool()
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`system_state\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`state_json\` LONGTEXT NOT NULL,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('✅ Base de datos BanaHosting conectada correctamente (zsonbkvb_classflow)')
  } catch (err) {
    console.error('⚠️ Error al conectar con MySQL en BanaHosting:', err.message)
  }
}
initDB()

// ─── API Routes ───────────────────────────────────────────────

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const p = getPool()
    const [rows] = await p.query('SELECT 1 as ok')
    res.json({ status: 'ok', database: 'connected', dbName: 'zsonbkvb_classflow' })
  } catch (err) {
    res.json({ status: 'ok', database: 'disconnected', error: err.message })
  }
})

// Get centralized database state for all 50 concurrent users
app.get('/api/sync', async (req, res) => {
  try {
    const p = getPool()
    const [rows] = await p.query('SELECT state_json FROM system_state WHERE id = ?', ['master_state'])
    if (rows.length > 0 && rows[0].state_json) {
      const data = JSON.parse(rows[0].state_json)
      return res.json({ success: true, data })
    }
    return res.json({ success: false, data: null })
  } catch (err) {
    console.error('Error GET /api/sync:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Save centralized database state (updates MySQL in real-time)
app.post('/api/sync', async (req, res) => {
  try {
    const p = getPool()
    const stateData = req.body
    if (!stateData) {
      return res.status(400).json({ error: 'No data provided' })
    }
    const stateJson = JSON.stringify(stateData)
    await p.query(
      `INSERT INTO system_state (id, state_json, updated_at) 
       VALUES ('master_state', ?, NOW()) 
       ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = NOW()`,
      [stateJson]
    )
    res.json({ success: true, message: 'Base de datos centralizada actualizada' })
  } catch (err) {
    console.error('Error POST /api/sync:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── Serve Frontend (React Single Page App) ────────────────────
const publicDir = path.join(__dirname, 'public')
app.use(express.static(publicDir))

// All other routes return index.html for React Router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.sendFile(path.join(publicDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 ClassFlow en BanaHosting corriendo en el puerto ${PORT}`)
})

module.exports = app

