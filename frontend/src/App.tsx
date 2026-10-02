import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/CoursesPage'
import StudentsPage from '@/pages/StudentsPage'
import StudentProfilePage from '@/pages/StudentProfilePage'
import AttendancePage from '@/pages/AttendancePage'
import GradesPage from '@/pages/GradesPage'
import ExamsPage from '@/pages/ExamsPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
        <Route path="/courses/new" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/students/new" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
        <Route path="/exams/new" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
