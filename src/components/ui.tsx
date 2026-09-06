import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useState } from 'react'

// ─── Button ──────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type BtnSize = 'sm' | 'md' | 'lg'

export function Button({
  variant = 'primary', size = 'md', loading, children, className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; size?: BtnSize; loading?: boolean
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
  const sizes = { sm: 'px-3.5 py-2 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' }
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200/60 dark:shadow-blue-900/40',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40',
    ghost: 'bg-white/60 dark:bg-slate-700/60 backdrop-blur text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 border border-white/80 dark:border-slate-600',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200/60 dark:shadow-red-900/40',
    outline: 'border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30',
  }
  return (
    <button {...props} disabled={props.disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({
  label, error, icon, rightEl, className = '', ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; icon?: ReactNode; rightEl?: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">{icon}</span>}
        <input
          {...props}
          className={`w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur border rounded-xl py-3 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all
            ${icon ? 'pl-11' : 'pl-4'} ${rightEl ? 'pr-11' : 'pr-4'}
            ${error ? 'border-red-400 dark:border-red-600 focus:ring-red-300 dark:focus:ring-red-800' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-400/50 dark:focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500'}
            ${className}`}
        />
        {rightEl && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</span>}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({
  label, error, children, className = '', ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        {...props}
        className={`w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500 transition-all ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({
  label, error, className = '', ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <textarea
        {...props}
        className={`w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500 transition-all resize-none ${className}`}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', glass = false }: {
  children: ReactNode; className?: string; glass?: boolean
}) {
  return (
    <div className={`rounded-2xl border transition-shadow ${glass
      ? 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-white/70 dark:border-slate-700/70 shadow-xl shadow-blue-100/30 dark:shadow-slate-900/50'
      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:shadow-slate-900/30'} ${className}`}>
      {children}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
export function Badge({ label, variant = 'blue', dot }: { label: string; variant?: BadgeVariant; dot?: boolean }) {
  const vars: Record<BadgeVariant, string> = {
    blue:   'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    green:  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    amber:  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    red:    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    slate:  'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${vars[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'blue' ? 'bg-blue-500' : variant === 'green' ? 'bg-emerald-500' : variant === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />}
      {label}
    </span>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 dark:border-slate-700 animate-[modalIn_0.2s_ease] flex flex-col max-h-[90vh]`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success' | 'info'; message: string }) {
  const styles = {
    error:   'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    info:    'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  }
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' }
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name, url, size = 40 }: { name?: string | null; url?: string | null; size?: number }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  if (url) return <img src={url} alt={name || ''} className="rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title, sub, action }: {
  icon?: string; title: string; sub?: string; action?: ReactNode
}) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="text-5xl">{icon}</div>
      <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">{title}</p>
      {sub && <p className="text-slate-400 dark:text-slate-500 text-sm">{sub}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'blue', sub }: {
  label: string; value: string | number; icon: string; color?: string; sub?: string
}) {
  const colors: Record<string, string> = {
    blue:   'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    green:  'from-emerald-500 to-emerald-600',
    amber:  'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
    red:    'from-red-500 to-red-600',
  }
  return (
    <Card glass className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color] || colors.blue} flex items-center justify-center text-xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: {
  tabs: { key: string; label: string; icon?: string }[]
  active: string
  onChange: (k: string) => void
}) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all duration-200
            ${active === t.key ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
          {t.icon && <span>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Status badge helper ──────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; v: BadgeVariant }> = {
    draft:     { label: 'Draft',      v: 'slate' },
    pending:   { label: 'Menunggu',   v: 'amber' },
    published: { label: 'Aktif',      v: 'green' },
    rejected:  { label: 'Ditolak',    v: 'red'   },
    completed: { label: 'Selesai',    v: 'purple' },
    accepted:  { label: 'Diterima',   v: 'green' },
  }
  const info = map[status] || { label: status, v: 'slate' as BadgeVariant }
  return <Badge label={info.label} variant={info.v} dot />
}

// ─── Page wrapper with glass bg ──────────────────────────────────────────────
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 ${className}`}>
      {children}
    </div>
  )
}

// ─── Password input ──────────────────────────────────────────────────────────
export function PasswordInput({ label, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string }) {
  const [show, setShow] = useState(false)
  return (
    <Input
      {...props}
      label={label}
      type={show ? 'text' : 'password'}
      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
      rightEl={
        <button type="button" onClick={() => setShow(!show)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {show
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      }
    />
  )
}
