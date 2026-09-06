import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { SponsorBanner } from '../components/SponsorBanner'
import { useTheme } from '../context/ThemeContext'

export function Landing() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const features = [
    { icon: '🎪', title: 'Buat & Kelola Event', sub: 'Host dapat membuat event bazaar, expo, festival, dan acara kampus dengan mudah.' },
    { icon: '🛒', title: 'Daftar sebagai UMKM', sub: 'UMKM dapat menemukan event yang sesuai dan mendaftar hanya dalam beberapa klik.' },
    { icon: '✅', title: 'Verifikasi & Aman', sub: 'Admin memverifikasi setiap event sebelum tayang agar kualitas terjaga.' },
    { icon: '📊', title: 'Dashboard Lengkap', sub: 'Pantau peserta, status pendaftaran, dan statistik event secara real-time.' },
  ]

  const testimonials = [
    { name: 'Rina S.', biz: 'Batik Nusantara', text: 'BZR memudahkan saya mendaftar ke 5 event sekaligus dalam waktu 10 menit!', avatar: '👩' },
    { name: 'Budi H.', biz: 'Event Organizer Jakarta', text: 'Manajemen peserta jadi sangat mudah. Tidak perlu lagi WhatsApp manual!', avatar: '👨' },
    { name: 'Sari W.', biz: 'Kerajinan Tangan Sari', text: 'Saya menemukan banyak event berkualitas dan diterima sebagai peserta!', avatar: '👩‍🦱' },
  ]

  const stats = [
    { v: '500+', l: 'Event Terlaksana' },
    { v: '2000+', l: 'UMKM Terdaftar' },
    { v: '50+', l: 'Kota di Indonesia' },
    { v: '98%', l: 'Kepuasan Pengguna' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-700/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-2xl px-4 py-1.5 rounded-xl shadow-lg shadow-blue-200/40">BZR</div>
            <span className="text-xs font-semibold text-slate-400 hidden sm:block">Platform Event UMKM</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
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
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Masuk</Button>
            <Button size="sm" onClick={() => navigate('/register')} className="shadow-lg shadow-blue-200/50">Daftar Gratis</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        {/* Background blobs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 text-sm font-bold px-5 py-2 rounded-full border border-blue-200 dark:border-blue-800 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            🚀 Platform Event UMKM #1 Indonesia
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6">
            Hubungkan <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">UMKM</span><br />dengan Event Terbaik
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            BZR menyederhanakan pendaftaran tenant untuk bazaar, expo, festival, dan acara sekolah/kampus. Cepat, mudah, dan terpercaya.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" onClick={() => navigate('/register')} className="shadow-2xl shadow-blue-300/50 px-8">
              Mulai Gratis →
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/login')}>
              Sudah punya akun
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-14">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {stats.map(s => (
            <div key={s.l} className="group">
              <p className="text-4xl font-black group-hover:scale-110 transition-transform duration-300">{s.v}</p>
              <p className="text-blue-200 text-sm mt-2 font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Semua yang Kamu Butuhkan</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">Fitur lengkap untuk host dan UMKM</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <div key={f.title} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/80 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1.5 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-300/30 mb-5 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-lg">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-bold text-white mb-14">Cara Kerja BZR</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📝', title: 'Daftar Akun', sub: 'Buat akun sebagai Host atau UMKM secara gratis' },
              { step: '02', icon: '🎪', title: 'Buat / Temukan Event', sub: 'Host buat event, UMKM browse dan pilih event yang cocok' },
              { step: '03', icon: '🚀', title: 'Daftar & Mulai', sub: 'Ajukan pendaftaran dan pantau statusnya secara real-time' },
            ].map(s => (
              <div key={s.step} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-xl shadow-blue-900/50 group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
                <p className="text-blue-400 text-xs font-bold tracking-widest mb-2">{s.step}</p>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Kata Mereka</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/80 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center text-xl">{t.avatar}</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.biz}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Sponsor Section ─────────────────────────────────────────────────── */}
      <SponsorBanner />

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
        <div className="relative">
          <h2 className="text-4xl font-black text-white mb-3">Siap Bergabung?</h2>
          <p className="text-blue-200 mb-10 text-lg">Gratis selamanya untuk UMKM dan Host.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" variant="ghost" onClick={() => navigate('/register')} className="shadow-2xl bg-white text-blue-700 hover:bg-blue-50 border-0">
              Daftar Sekarang →
            </Button>
            <Button size="lg" onClick={() => navigate('/login')} className="bg-white/20 text-white hover:bg-white/30 border border-white/30 shadow-none">
              Masuk
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-2xl px-5 py-2 rounded-xl inline-block mb-3 shadow-lg">BZR</div>
        <p className="text-slate-500 text-sm mt-2">© 2026 BZR. Platform Event & UMKM Indonesia.</p>
        <p className="text-slate-600 text-xs mt-2">Didukung oleh Crystalin & Good Day</p>
      </footer>
    </div>
  )
}
