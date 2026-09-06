import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Alert, Button, Card, PageShell, PasswordInput } from '../../components/ui'

export function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Pastikan user mendapatkan session dari link email sebelum mengubah password
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Sesi tidak valid atau telah kadaluarsa. Silakan request link reset password baru.')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Password tidak cocok.'); return }
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return }
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <Card glass className="p-10 max-w-md w-full text-center space-y-4 relative">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-slate-800">Password Berhasil Diubah!</h2>
          <p className="text-slate-500">Kamu sudah bisa login dengan password baru.</p>
          <Button onClick={() => navigate('/login')} className="w-full">Ke Halaman Login</Button>
        </Card>
      </PageShell>
    )
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
          <h1 className="text-2xl font-bold text-slate-800">Buat Password Baru</h1>
          <p className="text-slate-500 text-sm">Masukkan password baru untuk akunmu</p>
        </div>

        <Card glass className="p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput label="Password Baru" placeholder="Min. 8 karakter" value={password} onChange={e => setPassword(e.target.value)} required />
            <PasswordInput label="Konfirmasi Password" placeholder="Ulangi password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

            {error && <Alert type="error" message={error} />}

            <Button type="submit" loading={loading} className="w-full" size="lg">Simpan Password Baru</Button>
          </form>
        </Card>
      </div>
    </PageShell>
  )
}
