# ClassFlow 🎓

> **Tu aula, organizada.**

Sistema web completo de gestión académica para profesores — cursos, estudiantes, asistencia y calificaciones en un solo lugar.

---

## 🚀 Inicio rápido (solo frontend con datos de demo)

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173** y haz clic en **"Usar cuenta de demostración"**.

---

## 🏗️ Estructura del proyecto

```
classflow/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/ui/        # Button, Input, Modal, Card, Badge, Avatar...
│       ├── components/layout/    # AppLayout, Sidebar, Topbar, MobileBottomNav
│       ├── pages/                # Dashboard, Cursos, Estudiantes, Asistencia...
│       ├── lib/
│       │   ├── utils.ts          # Cálculo de promedios, formateo, utilidades
│       │   └── mockData.ts       # Base de datos en memoria para el MVP
│       ├── store/                # Zustand (auth, UI, toasts)
│       └── types/                # Tipos TypeScript
└── backend/           # Node.js + Express + TypeScript + Prisma + PostgreSQL
    ├── src/
    │   ├── routes/               # auth, courses, students, attendance, grades, reports
    │   ├── middleware/           # JWT auth, error handler centralizado
    │   └── lib/                  # Prisma client singleton
    └── prisma/
        ├── schema.prisma         # Modelos: User, Course, Student, Enrollment...
        └── seed.ts               # Datos de prueba (1 profesor, 4 cursos, 80 estudiantes)
```

---

## ✨ Funcionalidades

| Módulo | Estado |
|--------|--------|
| Autenticación (Login/Registro) | ✅ Frontend + Backend |
| Dashboard con gráficos y estadísticas | ✅ |
| Gestión de cursos (CRUD) | ✅ |
| Gestión de estudiantes con búsqueda | ✅ |
| Perfil individual del estudiante | ✅ |
| Asistencia rápida (optimizada móvil) | ✅ |
| Calificaciones con promedio ponderado | ✅ |
| Exámenes y evaluaciones | ✅ |
| Reportes y análisis académico | ✅ |
| Alertas de estudiantes en riesgo | ✅ |
| Modo oscuro | ✅ |
| Responsive (móvil, tablet, desktop) | ✅ |
| API REST (backend) | ✅ |
| JWT + bcrypt | ✅ |
| PostgreSQL + Prisma | ✅ |

---

## 🛠️ Stack tecnológico

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4 + React Router + Zustand + React Hook Form + Zod + Recharts + Lucide React

**Backend:** Node.js + Express + TypeScript + Prisma ORM + PostgreSQL + JWT + bcryptjs

---

## 🗄️ Configurar el backend

```bash
cd backend
cp .env.example .env   # Editar con tus credenciales de PostgreSQL
npm install
npx prisma migrate dev --name init
npm run prisma:seed    # Crea datos de prueba
npm run dev            # http://localhost:3001
```

## 📝 Credenciales demo

- **Email:** `profesor@classflow.com`
- **Contraseña:** `demo1234`
