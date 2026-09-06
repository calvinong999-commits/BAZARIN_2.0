import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Alert, Button, Card, Input, PageShell, PasswordInput } from '../../components/ui'

export function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <PageShell className="flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-3xl px-5 py-2 rounded-2xl shadow-xl shadow-blue-300/40">
            BZR
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Selamat Datang Kembali</h1>
          <p className="text-slate-500 text-sm">Platform Event & UMKM Indonesia</p>
        </div>

        <Card glass className="p-8 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div className="text-right">
              <button type="button" onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:underline font-medium">
                Lupa password?
              </button>
            </div>

            {error && <Alert type="error" message={error} />}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Masuk
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative text-center"><span className="bg-white px-3 text-xs text-slate-400">atau</span></div>
          </div>

          <p className="text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <button onClick={() => navigate('/register')} className="text-blue-600 font-semibold hover:underline">
              Daftar gratis
            </button>
          </p>
        </Card>

        <p className="text-center text-xs text-slate-400">
          © 2026 BZR. Hak cipta dilindungi.
        </p>
      </div>
    </PageShell>
  )
}
