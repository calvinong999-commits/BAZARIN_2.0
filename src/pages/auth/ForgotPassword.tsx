import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Alert, Button, Card, Input, PageShell } from '../../components/ui'

export function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <PageShell className="flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-3xl px-5 py-2 rounded-2xl shadow-xl shadow-blue-300/40">BZR</div>
          <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-slate-500 text-sm">Masukkan email untuk reset password</p>
        </div>

        <Card glass className="p-8 space-y-5">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" placeholder="nama@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                required />
              {error && <Alert type="error" message={error} />}
              <Button type="submit" loading={loading} className="w-full" size="lg">Kirim Link Reset</Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">📩</div>
              <p className="text-slate-700">Link reset password telah dikirim ke <strong>{email}</strong>. Cek inbox kamu.</p>
            </div>
          )}

          <button onClick={() => navigate('/login')} className="w-full text-center text-sm text-blue-600 hover:underline font-medium">
            ← Kembali ke Login
          </button>
        </Card>
      </div>
    </PageShell>
  )
}
