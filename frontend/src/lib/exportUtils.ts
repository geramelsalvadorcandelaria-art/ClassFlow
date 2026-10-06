import * as XLSX from 'xlsx'

interface ExportStudentItem {
  studentId: string
  firstName: string
  lastName: string
  courseName?: string
  email?: string
  status?: string
  attendanceRate?: number
  averageGrade?: number
}

interface ExportAttendanceItem {
  studentId: string
  name: string
  status: string
}

/**
 * Exporta una lista de estudiantes a Excel (.xlsx)
 */
export function exportStudentsToExcel(students: ExportStudentItem[], courseTitle = 'Estudiantes') {
  const rows = students.map((s) => ({
    'Número': s.studentId,
    'Apellidos': s.lastName,
    'Nombres': s.firstName,
    'Curso': s.courseName || courseTitle,
    'Correo Electrónico': s.email || '—',
    'Asistencia (%)': s.attendanceRate !== undefined ? `${s.attendanceRate}%` : '—',
    'Promedio': s.averageGrade !== undefined && s.averageGrade > 0 ? s.averageGrade.toFixed(1) : '—',
    'Estado': s.status === 'active' ? 'Activo' : 'Inactivo',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Estudiantes')

  // Auto-ajustar ancho de columnas
  const maxProps = ['Número', 'Apellidos', 'Nombres', 'Curso', 'Correo Electrónico', 'Asistencia (%)', 'Promedio', 'Estado']
  worksheet['!cols'] = maxProps.map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key] || '').length)) + 2,
  }))

  const cleanName = courseTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')
  XLSX.writeFile(workbook, `Lista_${cleanName}.xlsx`)
}

/**
 * Exporta una lista de estudiantes a Microsoft Word (.doc)
 */
export function exportStudentsToWord(students: ExportStudentItem[], courseTitle = 'Estudiantes') {
  const dateFormatted = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const rowsHtml = students
    .map(
      (s) => `
    <tr>
      <td style="text-align: center;">${s.studentId}</td>
      <td><strong>${s.lastName}</strong></td>
      <td>${s.firstName}</td>
      <td>${s.courseName || courseTitle}</td>
      <td>${s.email || '—'}</td>
      <td style="text-align: center;">${s.attendanceRate !== undefined ? `${s.attendanceRate}%` : '—'}</td>
      <td style="text-align: center;">${s.averageGrade !== undefined && s.averageGrade > 0 ? s.averageGrade.toFixed(1) : '—'}</td>
      <td style="text-align: center;">${s.status === 'active' ? 'Activo' : 'Inactivo'}</td>
    </tr>`
    )
    .join('')

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${courseTitle}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
        .header h1 { margin: 0 0 6px 0; color: #1e3a8a; font-size: 22px; }
        .header p { margin: 2px 0; color: #64748b; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
        th { background-color: #2563eb; color: #ffffff; padding: 10px 8px; border: 1px solid #1d4ed8; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 25px; font-size: 11px; color: #94a3b8; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>REGISTRO ACADÉMICO DE ESTUDIANTES</h1>
        <p><strong>Curso:</strong> ${courseTitle} | <strong>Total Estudiantes:</strong> ${students.length}</p>
        <p><strong>Fecha de emisión:</strong> ${dateFormatted}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">No.</th>
            <th>Apellidos</th>
            <th>Nombres</th>
            <th>Curso</th>
            <th>Correo</th>
            <th style="text-align: center;">Asistencia</th>
            <th style="text-align: center;">Promedio</th>
            <th style="text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">
        Documento generado automáticamente por ClassFlow · ${dateFormatted}
      </div>
    </body>
    </html>
  `

  downloadDocBlob(htmlContent, `Lista_${courseTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}.doc`)
}

/**
 * Exporta el pase de lista de asistencia a Excel (.xlsx)
 */
export function exportAttendanceToExcel(params: {
  courseName: string
  date: string
  records: ExportAttendanceItem[]
}) {
  const { courseName, date, records } = params

  const rows = records.map((r) => ({
    'Número': r.studentId,
    'Estudiante': r.name,
    'Estado de Asistencia': r.status,
    'Curso': courseName,
    'Fecha': date,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pase de Lista')

  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 32 },
    { wch: 22 },
    { wch: 24 },
    { wch: 14 },
  ]

  const cleanName = `${courseName}_${date}`.replace(/[^a-zA-Z0-9_\-]/g, '_')
  XLSX.writeFile(workbook, `Asistencia_${cleanName}.xlsx`)
}

/**
 * Exporta el pase de lista de asistencia a Word (.doc)
 */
export function exportAttendanceToWord(params: {
  courseName: string
  date: string
  records: ExportAttendanceItem[]
}) {
  const { courseName, date, records } = params

  const rowsHtml = records
    .map(
      (r) => `
    <tr>
      <td style="text-align: center;">${r.studentId}</td>
      <td><strong>${r.name}</strong></td>
      <td style="text-align: center; font-weight: bold; color: ${
        r.status === 'Presente' ? '#16a34a' : r.status === 'Tardanza' ? '#ca8a04' : r.status === 'Ausente' ? '#dc2626' : '#2563eb'
      };">${r.status}</td>
      <td>${courseName}</td>
      <td style="text-align: center;">${date}</td>
    </tr>`
    )
    .join('')

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Asistencia - ${courseName}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #16a34a; padding-bottom: 15px; }
        .header h1 { margin: 0 0 6px 0; color: #15803d; font-size: 22px; }
        .header p { margin: 2px 0; color: #64748b; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
        th { background-color: #16a34a; color: #ffffff; padding: 10px 8px; border: 1px solid #15803d; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 25px; font-size: 11px; color: #94a3b8; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>REGISTRO DIARIO DE ASISTENCIA</h1>
        <p><strong>Curso:</strong> ${courseName} | <strong>Fecha:</strong> ${date}</p>
        <p><strong>Total de Alumnos:</strong> ${records.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">No.</th>
            <th>Estudiante</th>
            <th style="text-align: center;">Estado</th>
            <th>Curso</th>
            <th style="text-align: center;">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">
        ClassFlow · Reporte generado el ${new Date().toLocaleDateString('es-ES')}
      </div>
    </body>
    </html>
  `

  downloadDocBlob(htmlContent, `Asistencia_${courseName.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${date}.doc`)
}

function downloadDocBlob(html: string, filename: string) {
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
