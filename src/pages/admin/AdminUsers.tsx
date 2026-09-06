import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Avatar, Badge, Card, Empty, Input, Spinner } from '../../components/ui'
import type { Profile } from '../../lib/types'

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers((data || []) as Profile[]); setLoading(false) })
  }, [])

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.business_name?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const roleColor: Record<string, 'blue' | 'green' | 'slate'> = { host: 'blue', umkm: 'green', admin: 'slate' }
  const roleLabel: Record<string, string> = { host: 'Host', umkm: 'UMKM', admin: 'Admin' }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="🔍 Cari nama atau usaha..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-48" />
        <div className="flex gap-2">
          {[{ k: 'all', l: 'Semua' }, { k: 'umkm', l: 'UMKM' }, { k: 'host', l: 'Host' }, { k: 'admin', l: 'Admin' }].map(f => (
            <button key={f.k} onClick={() => setRoleFilter(f.k)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${roleFilter === f.k ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-400'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12"><Empty icon="👥" title="Tidak ada pengguna" /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(u => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={u.full_name} url={u.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm truncate">{u.full_name || '—'}</p>
                    <Badge label={roleLabel[u.role] || u.role} variant={roleColor[u.role] || 'slate'} />
                  </div>
                  {u.business_name && <p className="text-xs text-slate-500 truncate">{u.business_name}</p>}
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                {u.phone && <p>📱 {u.phone}</p>}
                {u.city && <p>📍 {u.city}</p>}
                <p>📅 Bergabung {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
