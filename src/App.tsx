import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SetupGuide } from './pages/SetupGuide'
import { supabase } from './lib/supabase'
import { AppLayout } from './components/AppLayout'
import { Landing } from './pages/Landing'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { HostDashboard } from './pages/host/HostDashboard'
import { HostEvents } from './pages/host/HostEvents'
import { EventForm } from './pages/host/EventForm'
import { HostApplicants } from './pages/host/HostApplicants'
import { BrowseEvents } from './pages/umkm/BrowseEvents'
import { MyRegistrations } from './pages/umkm/MyRegistrations'
import { PaymentPage } from './pages/umkm/PaymentPage'
import { UMKMProfile } from './pages/umkm/UMKMProfile'
import { InboxPage } from './pages/InboxPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminEvents } from './pages/admin/AdminEvents'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminCategories } from './pages/admin/AdminCategories'
import { Spinner } from './components/ui'

// ─── Loading splash ────────────────────────────────────────────────────────────
function LoadingSplash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-3xl px-6 py-2 rounded-2xl inline-block shadow-xl">BZR</div>
        <div><Spinner size={28} className="text-blue-600 mx-auto" /></div>
      </div>
    </div>
  )
}

// ─── Layout wrapper pakai <Outlet> supaya AppLayout mount sekali saja ──────────
// Navigasi antar child route TIDAK akan unmount/remount AppLayout
function ProtectedLayout({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSplash />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.profile?.role || '')) {
    const role = user.profile?.role
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'host') return <Navigate to="/host" replace />
    return <Navigate to="/browse" replace />
  }

  // AppLayout hanya di-render SEKALI — Outlet mengisi konten tiap route
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

// ─── Redirect user yang sudah login dari halaman publik ────────────────────────
function PublicOnly() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSplash />

  if (user) {
    const role = user.profile?.role
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'host') return <Navigate to="/host" replace />
    return <Navigate to="/browse" replace />
  }

  return <Outlet />
}

// ─── App Inner ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { loading } = useAuth()
  const [dbReady, setDbReady] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.from('categories').select('id').limit(1)
      .then(({ error }) => setDbReady(!error))
  }, [])

  if (dbReady === false) return <SetupGuide />

  if (loading || dbReady === null) return <LoadingSplash />

  return (
    <Routes>
      {/* ── Halaman publik (redirect ke dashboard jika sudah login) ── */}
      <Route element={<PublicOnly />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── UMKM (AppLayout di-mount SEKALI untuk semua child routes) ── */}
      <Route element={<ProtectedLayout allowedRoles={['umkm']} />}>
        <Route path="/browse" element={<BrowseEvents />} />
        <Route path="/registrations" element={<MyRegistrations />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/profile" element={<UMKMProfile />} />
        <Route path="/inbox" element={<InboxPage />} />
      </Route>

      {/* ── Host (AppLayout di-mount SEKALI untuk semua child routes) ── */}
      <Route element={<ProtectedLayout allowedRoles={['host']} />}>
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/events" element={<HostEvents />} />
        <Route path="/host/events/create" element={<EventForm />} />
        <Route path="/host/events/edit" element={<EventForm />} />
        <Route path="/host/applicants" element={<HostApplicants />} />
        <Route path="/host/inbox" element={<InboxPage />} />
      </Route>

      {/* ── Admin (AppLayout di-mount SEKALI untuk semua child routes) ── */}
      <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}
