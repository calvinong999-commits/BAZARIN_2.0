import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Card, Empty, Modal, Spinner, StatusBadge, Textarea } from '../../components/ui'
import type { Event } from '../../lib/types'

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [modal, setModal] = useState<{ event: Event; action: 'published' | 'rejected' } | null>(null)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)

  async function load() {
    setLoading(true)
    let q = supabase.from('events').select('*, profiles(full_name, phone), categories(name)').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setEvents((data || []) as Event[])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleAction() {
    if (!modal) return
    setActing(true)
    await supabase.from('events').update({ status: modal.action, admin_notes: notes || null }).eq('id', modal.event.id)
    setModal(null); setNotes(''); setActing(false)
    load()
  }

  const FILTERS = [
    { k: 'pending', l: 'Menunggu' },
    { k: 'published', l: 'Aktif' },
    { k: 'rejected', l: 'Ditolak' },
    { k: 'all', l: 'Semua' },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Manajemen Event</h2>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${filter === f.k ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-400'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>
      ) : events.length === 0 ? (
        <Card className="p-12"><Empty icon="🎪" title="Tidak ada event" /></Card>
      ) : (
        <div className="space-y-3">
          {events.map(e => {
            const host = (e as any).profiles
            const cat = (e as any).categories
            return (
              <Card key={e.id} className="p-5">
                <div className="flex gap-4 items-start flex-wrap">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    {e.cover_image ? <img src={e.cover_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800">{e.title}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-sm text-slate-500">📅 {new Date(e.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(e.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-sm text-slate-500">📍 {e.city} · {e.location || '—'}</p>
                    <p className="text-sm text-slate-500">👤 Host: {host?.full_name || '—'} · 📱 {e.contact_phone || host?.phone || '—'}</p>
                    <div className="flex gap-4 text-sm font-semibold mt-1 flex-wrap">
                      {e.proposal_url && (
                        <a href={e.proposal_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          📄 Proposal
                        </a>
                      )}
                      {e.izin_url && (
                        <a href={e.izin_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                          📄 Surat Izin
                        </a>
                      )}
                      {e.ktp_url && (
                        <a href={e.ktp_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          🖼️ KTP Host
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">🏷️ {cat?.name || '—'} · 🎫 {e.total_slots} slot · 💰 {e.price === 0 ? 'Gratis' : `Rp ${e.price.toLocaleString('id-ID')}`}</p>
                    {e.description && <p className="text-xs text-slate-400 line-clamp-2">{e.description}</p>}
                    {e.admin_notes && <p className="text-xs text-amber-600">Catatan admin: {e.admin_notes}</p>}
                  </div>
                  {e.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="danger" onClick={() => { setModal({ event: e, action: 'rejected' }); setNotes('') }}>Tolak</Button>
                      <Button size="sm" onClick={() => { setModal({ event: e, action: 'published' }); setNotes('') }}>Verifikasi</Button>
                    </div>
                  )}
                  {e.status === 'published' && (
                    <Button size="sm" variant="danger" onClick={() => { setModal({ event: e, action: 'rejected' }); setNotes('') }}>Cabut</Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setNotes('') }}
        title={modal?.action === 'published' ? '✅ Verifikasi Event' : '❌ Tolak/Cabut Event'}>
        <div className="space-y-4">
          <p className="text-slate-600">
            {modal?.action === 'published' ? `Verifikasi dan publikasikan event "${modal?.event.title}"?` : `Tolak event "${modal?.event.title}"?`}
          </p>
          <Textarea label="Catatan Admin (opsional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Alasan penolakan atau catatan..." />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setModal(null); setNotes('') }} className="flex-1">Batal</Button>
            <Button variant={modal?.action === 'published' ? 'primary' : 'danger'} loading={acting} onClick={handleAction} className="flex-1">
              {modal?.action === 'published' ? 'Verifikasi & Publikasi' : 'Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
