import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Empty, Modal, Spinner, StatusBadge } from '../../components/ui'
import { EventReviews } from '../../components/EventReviews'
import type { Event } from '../../lib/types'

export function HostEvents() {
  const navigate = useNavigate()

  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reviewEvent, setReviewEvent] = useState<Event | null>(null)

  async function load() {
    if (!user) return
    const { data } = await supabase.from('events').select('*, categories(name)').eq('host_id', user.id).order('created_at', { ascending: false })
    setEvents((data || []) as Event[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} className="text-blue-600" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Event Saya</h2>
        <Button onClick={() => navigate('/host/events/create')} size="sm">+ Buat Event</Button>
      </div>

      {events.length === 0 ? (
        <Card className="p-12">
          <Empty icon="🎪" title="Belum ada event" sub="Buat event pertamamu sekarang"
            action={<Button onClick={() => navigate('/host/events/create')} size="sm">+ Buat Event</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map(e => (
            <Card key={e.id} className="overflow-hidden group hover:shadow-lg transition-all">
              <div className="relative h-44 bg-slate-100">
                {e.cover_image
                  ? <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">🎪</div>}
                <div className="absolute top-3 left-3"><StatusBadge status={e.status} /></div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-800 leading-tight">{e.title}</h3>
                <p className="text-xs text-slate-500">📅 {new Date(e.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-slate-500">📍 {e.city || e.location || '—'}</p>
                <p className="text-xs text-slate-500">🏷️ {(e as any).categories?.name || '—'} · {e.total_slots} slot</p>

                {e.admin_notes && e.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700">
                    <strong>Catatan admin:</strong> {e.admin_notes}
                  </div>
                )}

                <div className="flex gap-1.5 pt-1 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => navigate('/host/events/edit', { state: { event: e } })} className="flex-1 text-xs px-2">Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/host/applicants', { state: { event: e } })} className="flex-1 text-xs px-2">Peserta</Button>
                  <Button variant="ghost" size="sm" onClick={() => setReviewEvent(e)} className="text-xs px-2 bg-amber-50 text-amber-700 hover:bg-amber-100">⭐ Rating</Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(e.id)} className="text-xs px-2">🗑</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Event">
        <p className="text-slate-600 mb-5">Yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1">Batal</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete} className="flex-1">Hapus</Button>
        </div>
      </Modal>

      {/* Host Event Reviews Modal */}
      <Modal open={!!reviewEvent} onClose={() => setReviewEvent(null)} title={`Rating & Ulasan UMKM`} size="xl">
        {reviewEvent && (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <EventReviews eventId={reviewEvent.id} eventTitle={reviewEvent.title} />
          </div>
        )}
      </Modal>
    </div>
  )
}
