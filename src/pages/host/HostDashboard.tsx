import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card, Empty, Spinner, StatCard, StatusBadge } from '../../components/ui'
import { SponsorBanner } from '../../components/SponsorBanner'
import type { Event, Registration } from '../../lib/types'

export function HostDashboard() {
  const navigate = useNavigate()

  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [recentRegs, setRecentRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const [evtRes, regRes] = await Promise.all([
        supabase.from('events').select('*, registrations(count)').eq('host_id', user.id).order('created_at', { ascending: false }),
        supabase.from('registrations').select('*, events(title), profiles(full_name, business_name)').eq('events.host_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      setEvents((evtRes.data || []) as Event[])
      setRecentRegs((regRes.data || []) as Registration[])
      setLoading(false)
    }
    load()
  }, [user])

  const stats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    pending: events.filter(e => e.status === 'pending').length,
    draft: events.filter(e => e.status === 'draft').length,
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} className="text-blue-600" /></div>

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200/50">
        <p className="text-blue-200 text-sm">Selamat datang kembali 👋</p>
        <h2 className="text-2xl font-bold mt-1">{user?.profile?.full_name || 'Host'}</h2>
        <p className="text-blue-100 text-sm mt-1">Kelola event dan pantau peserta dari sini</p>
        <button onClick={() => navigate('/host/events/create')}
          className="mt-4 bg-white text-blue-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-md">
          + Buat Event Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Event" value={stats.total} icon="🎪" color="blue" />
        <StatCard label="Event Aktif" value={stats.published} icon="✅" color="green" />
        <StatCard label="Menunggu Verifikasi" value={stats.pending} icon="⏳" color="amber" />
        <StatCard label="Draft" value={stats.draft} icon="📝" color="slate" />
      </div>

      {/* Recent events */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Event Terbaru</h3>
          <button onClick={() => navigate('/host/events')} className="text-sm text-blue-600 hover:underline font-medium">Lihat semua</button>
        </div>

        {events.length === 0 ? (
          <Empty icon="🎪" title="Belum ada event" sub="Mulai buat event pertamamu!"
            action={<button onClick={() => navigate('/host/events/create')} className="text-blue-600 font-semibold text-sm hover:underline">Buat Event →</button>} />
        ) : (
          <div className="space-y-3">
            {events.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl overflow-hidden shrink-0">
                  {e.cover_image
                    ? <img src={e.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🎪</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">{e.city} · {new Date(e.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sponsor Banner di bagian bawah */}
      <div className="pt-8">
        <SponsorBanner />
      </div>
    </div>
  )
}
