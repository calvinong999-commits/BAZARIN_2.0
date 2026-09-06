import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Alert, Button, Card, Input, PageShell, PasswordInput, Spinner } from '../../components/ui'
import type { Role } from '../../lib/types'

export function Register() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>('umkm')
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', businessName: '', phone: '', city: '',
  })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) { setError('Nama lengkap wajib diisi.'); return }
    if (!form.phone.trim()) { setError('Nomor telepon wajib diisi.'); return }
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok.'); return }
    if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return }
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, role },
      },
    })

    if (signUpError) {
      // Pesan error yang lebih ramah pengguna
      let msg = signUpError.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
      } else if (msg.includes('invalid email')) {
        msg = 'Format email tidak valid.'
      } else if (msg.includes('password')) {
        msg = 'Password terlalu lemah. Gunakan kombinasi huruf dan angka.'
      }
      setError(msg)
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(3) // Lanjut ke OTP
    startResendCooldown()
  }

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return
    setResendLoading(true)
    setError('')
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: form.email,
    })
    if (resendErr) {
      setError('Gagal mengirim ulang OTP: ' + resendErr.message)
    } else {
      startResendCooldown()
    }
    setResendLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp || otp.length < 6) { setError('Masukkan kode OTP 6 digit.'); return }
    setLoading(true)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'signup',
    })

    if (verifyError) {
      let msg = verifyError.message
      if (msg.includes('expired') || msg.includes('invalid')) {
        msg = 'Kode OTP tidak valid atau sudah kadaluarsa. Klik "Kirim Ulang OTP".'
      }
      setError(msg)
      setLoading(false)
      return
    }

    if (data.session?.user) {
      // Upsert profile setelah user terverifikasi
      await supabase.from('profiles').upsert({
        id: data.session.user.id,
        role,
        full_name: form.fullName,
        business_name: form.businessName || null,
        phone: form.phone || null,
        city: form.city || null,
      })
      
      setDone(true)
      setTimeout(() => {
        window.location.href = '/' // Force full reload agar AuthContext menangkap profile terbaru
      }, 1500)
    } else {
      setError('Terjadi kesalahan saat memverifikasi sesi. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        <Card glass className="p-10 max-w-md w-full text-center space-y-4 relative">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Registrasi Berhasil!</h2>
          <p className="text-slate-500 dark:text-slate-400">Akun kamu telah berhasil dibuat dan diverifikasi.</p>
          <Spinner className="mx-auto text-blue-600 mt-4" />
          <p className="text-xs text-slate-400 dark:text-slate-500">Mengarahkan ke dashboard...</p>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell className="flex items-center justify-center p-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-3xl px-5 py-2 rounded-2xl shadow-xl shadow-blue-300/40">
            BZR
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Buat Akun Baru</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Bergabung dengan ribuan pengguna BZR</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
          ))}
        </div>

        <Card glass className="p-8 space-y-5">
          {/* Step 1: Role + Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Pilih Peran Kamu</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { r: 'umkm' as Role, emoji: '🛒', label: 'UMKM', sub: 'Cari & daftar event' },
                  { r: 'host' as Role, emoji: '🎪', label: 'Host', sub: 'Buat & kelola event' },
                ].map(opt => (
                  <button key={opt.r} type="button" onClick={() => setRole(opt.r)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${role === opt.r
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white/40 dark:bg-slate-800/40'}`}>
                    <div className="text-2xl mb-1">{opt.emoji}</div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.sub}</p>
                  </button>
                ))}
              </div>

              <Input label="Email" type="email" placeholder="nama@email.com" value={form.email} onChange={e => set('email', e.target.value)}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                required />
              <PasswordInput label="Password" placeholder="Min. 8 karakter" value={form.password} onChange={e => set('password', e.target.value)} required />
              <PasswordInput label="Konfirmasi Password" placeholder="Ulangi password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />

              {error && <Alert type="error" message={error} />}

              <Button onClick={() => {
                setError('')
                if (!form.email || !form.password) { setError('Lengkapi email dan password.'); return }
                if (form.password !== form.confirmPassword) { setError('Password tidak cocok.'); return }
                if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return }
                setStep(2)
              }} className="w-full" size="lg">
                Lanjut →
              </Button>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Lengkapi Profil</h2>

              <Input label="Nama Lengkap *" placeholder="Nama sesuai KTP" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              <Input label="Nomor Telepon *" type="tel" placeholder="+628123456789" value={form.phone} onChange={e => {
                let v = e.target.value.replace(/[^0-9]/g, '')
                if (v.startsWith('62')) v = v.substring(2)
                else if (v.startsWith('0')) v = v.substring(1)
                if (v.length > 13) v = v.substring(0, 13)
                set('phone', v ? `+62${v}` : '')
              }} required />
              <Input label="Kota *" placeholder="Jakarta" value={form.city} onChange={e => set('city', e.target.value)} required />
              {role === 'umkm' && (
                <Input label="Nama Usaha (Opsional)" placeholder="Nama UMKM kamu" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
              )}

              {error && <Alert type="error" message={error} />}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">← Kembali</Button>
                <Button type="submit" loading={loading} className="flex-1" size="lg">Kirim OTP</Button>
              </div>
            </form>
          )}

          {/* Step 3: OTP */}
          {step === 3 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Verifikasi Email</h2>
              
              {/* Email info */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700 rounded-xl p-3 flex items-start gap-3">
                <span className="text-xl mt-0.5">📧</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cek email kamu!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kode OTP 6-digit telah dikirim ke <strong className="text-blue-600 dark:text-blue-400">{form.email}</strong>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cek folder Spam/Junk jika tidak ditemukan di Inbox.</p>
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kode OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-xl py-4 px-4 text-slate-800 dark:text-slate-100 text-2xl font-mono tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                />
              </div>

              {error && <Alert type="error" message={error} />}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                ✓ Verifikasi & Buat Akun
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Kirim ulang dalam <span className="font-bold text-blue-600 dark:text-blue-400">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                  >
                    {resendLoading && <Spinner size={12} />}
                    Tidak terima OTP? Kirim Ulang
                  </button>
                )}
              </div>
            </form>
          )}

          {step < 3 && (
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Sudah punya akun?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Masuk</button>
            </p>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
