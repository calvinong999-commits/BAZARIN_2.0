import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { StatCard, Card, Spinner, StatusBadge } from '../../components/ui'
import type { Event } from '../../lib/types'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, events: 0, pending: 0, registrations: 0 })
  const [pendingEvents, setPendingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, eventsRes, pendingRes, regsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('*, profiles(full_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: usersRes.count || 0,
        events: eventsRes.count || 0,
        pending: (pendingRes.data || []).length,
        registrations: regsRes.count || 0,
      })
      setPendingEvents((pendingRes.data || []) as Event[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} className="text-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl p-6 text-white shadow-xl">
        <p className="text-slate-400 text-sm">Panel Administrator</p>
        <h2 className="text-2xl font-bold mt-1">BZR Admin</h2>
        <p className="text-slate-300 text-sm mt-1">Kelola platform dari sini</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengguna" value={stats.users} icon="👥" color="blue" />
        <StatCard label="Total Event" value={stats.events} icon="🎪" color="indigo" />
        <StatCard label="Menunggu Verifikasi" value={stats.pending} icon="⏳" color="amber" />
        <StatCard label="Total Pendaftaran" value={stats.registrations} icon="📋" color="green" />
      </div>

      {pendingEvents.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 mb-4">⏳ Event Menunggu Verifikasi</h3>
          <div className="space-y-3">
            {pendingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                  {e.cover_image ? <img src={e.cover_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎪</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">{(e as any).profiles?.full_name} · {e.city} · {new Date(e.start_date).toLocaleDateString('id-ID')}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
