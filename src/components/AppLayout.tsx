import { type ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Avatar, Modal, Button } from './ui'

const NAV: Record<string, { label: string; icon: string; path: string }[]> = {
  host: [
    { label: 'Dashboard', icon: '📊', path: '/host' },
    { label: 'Event Saya', icon: '🎪', path: '/host/events' },
    { label: 'Peserta', icon: '👥', path: '/host/applicants' },
    { label: 'Inbox Chat', icon: '💬', path: '/host/inbox' },
  ],
  umkm: [
    { label: 'Jelajah Event', icon: '🔍', path: '/browse' },
    { label: 'Pendaftaranku', icon: '📋', path: '/registrations' },
    { label: 'Pembayaran', icon: '💳', path: '/payment' },
    { label: 'Inbox Chat', icon: '💬', path: '/inbox' },
    { label: 'Profil', icon: '👤', path: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', icon: '📊', path: '/admin' },
    { label: 'Event', icon: '🎪', path: '/admin/events' },
    { label: 'Pengguna', icon: '👥', path: '/admin/users' },
    { label: 'Kategori', icon: '🏷️', path: '/admin/categories' },
  ],
}

interface Props {
  children: ReactNode
}

export function AppLayout({ children }: Props) {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const role = user?.profile?.role || 'umkm'
  const navItems = NAV[role] || []

  const roleLabel = { host: 'Event Host', umkm: 'UMKM', admin: 'Administrator' }[role]
  const roleColor = { host: 'from-blue-500 to-indigo-600', umkm: 'from-emerald-500 to-teal-600', admin: 'from-slate-700 to-slate-800' }[role]

  // Active state berdasarkan URL pathname
  function isActive(path: string) {
    if (path === '/host' || path === '/admin') return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const currentLabel = navItems.find(n => isActive(n.path))?.label || 'BZR'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-100 dark:border-slate-700 shadow-xl flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none`}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${roleColor} text-white font-black text-2xl px-4 py-1.5 rounded-xl shadow-lg`}>
            BZR
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{roleLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item.path)
            return (
              <button key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${active ? `bg-gradient-to-r ${roleColor} text-white shadow-md` : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {active && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 ml-auto"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Avatar name={user?.profile?.full_name} url={user?.profile?.avatar_url} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.profile?.full_name || 'Pengguna'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => setLogoutModal(true)}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700 px-5 py-3.5 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 className="font-bold text-slate-800 dark:text-slate-100 flex-1">{currentLabel}</h1>

          {/* Dark mode toggle */}
          <button
            id="dark-mode-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm"
          >
            <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}>
              {/* Moon icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </span>
            <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}>
              {/* Sun icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </span>
          </button>

          <Avatar name={user?.profile?.full_name} url={user?.profile?.avatar_url} size={32} />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 lg:p-8 bg-transparent">
          {children}
        </main>
      </div>

      {/* Logout Modal */}
      <Modal open={logoutModal} onClose={() => setLogoutModal(false)} title="Konfirmasi Keluar">
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm">Apakah kamu setuju untuk logout dari akun ini?</p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setLogoutModal(false)} className="flex-1">Tidak</Button>
            <Button variant="danger" onClick={signOut} className="flex-1">Ya, Keluar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
