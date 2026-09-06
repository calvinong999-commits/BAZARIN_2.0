import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Empty, Modal, Select, Spinner, StatusBadge, Textarea } from '../../components/ui'
import { UmkmReviewModal } from '../../components/UmkmReviewModal'
import { UmkmReviewsList } from '../../components/UmkmReviewsList'
import { ChatModal } from '../../components/ChatModal'
import type { Event, Registration } from '../../lib/types'

export function HostApplicants() {
  const location = useLocation()
  // selectedEvent dikirim via navigate('/host/applicants', { state: { event } })
  const selectedEvent = (location.state as any)?.event as Event | undefined

  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [activeEvent, setActiveEvent] = useState<Event | null>(selectedEvent || null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState<{ reg: Registration; action: 'accepted' | 'rejected' } | null>(null)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [filter, setFilter] = useState('all')

  // Rating & Reputasi
  const [reviewModal, setReviewModal] = useState<{ reg: Registration } | null>(null)
  const [reputasiModal, setReputasiModal] = useState<{ umkmId: string; name: string } | null>(null)
  
  // Chat Modal State
  const [chatModal, setChatModal] = useState<Registration | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('events').select('id, title, status').eq('host_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        const evts = (data || []) as Event[]
        setEvents(evts)
        if (!activeEvent && evts.length > 0) setActiveEvent(evts[0])
      })
  }, [user])

  useEffect(() => {
    if (!activeEvent) { setLoading(false); return }
    setLoading(true)
    supabase.from('registrations')
      .select('*, profiles(full_name, business_name, phone, city)')
      .eq('event_id', activeEvent.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRegistrations((data || []) as Registration[])
        setLoading(false)
      })
  }, [activeEvent])

  async function handleAction() {
    if (!actionModal) return
    setActing(true)
    await supabase.from('registrations').update({ status: actionModal.action, host_notes: notes || null }).eq('id', actionModal.reg.id)
    setRegistrations(prev => prev.map(r => r.id === actionModal.reg.id ? { ...r, status: actionModal.action, host_notes: notes } : r))
    setActionModal(null)
    setNotes('')
    setActing(false)
  }

  const filtered = filter === 'all' ? registrations : registrations.filter(r => r.status === filter)

  function exportToCSV() {
    if (filtered.length === 0) return
    const headers = ['Nama Usaha', 'Nama Pemilik', 'No HP', 'Alamat', 'Jenis Produk', 'Status', 'Catatan', 'Tanggal Daftar']
    const rows = filtered.map(reg => {
      const profile = reg.profiles as any
      return [
        reg.business_name || profile?.business_name || '-',
        profile?.full_name || '-',
        reg.phone || profile?.phone || '-',
        reg.address || '-',
        reg.product_type || '-',
        reg.status,
        reg.notes || '-',
        new Date(reg.created_at).toLocaleDateString('id-ID')
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Rekap_Peserta_${activeEvent?.title || 'Event'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800">Manajemen Peserta</h2>
      </div>

      {/* Event selector */}
      {events.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-600 shrink-0">Event:</span>
            <div className="flex gap-2 flex-wrap">
              {events.map(e => (
                <button key={e.id} onClick={() => setActiveEvent(e)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${activeEvent?.id === e.id ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-400'}`}>
                  {e.title}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      {activeEvent && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[{ k: 'all', l: 'Semua' }, { k: 'pending', l: 'Menunggu' }, { k: 'accepted', l: 'Diterima' }, { k: 'rejected', l: 'Ditolak' }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${filter === f.k ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-400'}`}>
                {f.l} {f.k === 'all' ? `(${registrations.length})` : `(${registrations.filter(r => r.status === f.k).length})`}
              </button>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={exportToCSV} disabled={filtered.length === 0} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            📥 Export CSV (Excel)
          </Button>
        </div>
      )}

      {!activeEvent ? (
        <Card className="p-12">
          <Empty icon="📋" title="Belum ada event" sub="Buat event dulu untuk melihat peserta" />
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12">
          <Empty icon="👥" title="Tidak ada peserta" sub="Belum ada yang mendaftar ke event ini" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(reg => {
            const profile = reg.profiles as any
            return (
              <Card key={reg.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{reg.business_name || profile?.business_name || '—'}</p>
                      <StatusBadge status={reg.status} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.full_name || '—'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">📱 {reg.phone || profile?.phone || '—'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">📍 {reg.address || '—'}</p>
                    {reg.ktp_url && (
                      <a href={reg.ktp_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 my-1">
                        📄 Lihat Foto KTP
                      </a>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">📝 {reg.product_type || '—'}</p>
                    {reg.notes && <p className="text-xs text-slate-400 italic">"{reg.notes}"</p>}
                    {reg.host_notes && <p className="text-xs text-amber-600 dark:text-amber-500">Catatan: {reg.host_notes}</p>}
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">{new Date(reg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 sm:items-center">
                    {reg.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setActionModal({ reg, action: 'rejected' })}>Tolak</Button>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setActionModal({ reg, action: 'accepted' })}>Terima</Button>
                      </div>
                    )}

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReputasiModal({ umkmId: reg.umkm_id, name: reg.business_name || profile?.business_name || 'UMKM' })}
                        className="text-xs"
                      >
                        📊 Reputasi
                      </Button>
                      {reg.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReviewModal({ reg })}
                          className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        >
                          ⭐ Nilai
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setChatModal(reg)}
                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      >
                        💬 Chat UMKM
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!actionModal} onClose={() => { setActionModal(null); setNotes('') }}
        title={actionModal?.action === 'accepted' ? '✅ Terima Peserta' : '❌ Tolak Peserta'}>
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {actionModal?.action === 'accepted'
              ? `Terima pendaftaran dari ${actionModal?.reg.business_name}?`
              : `Tolak pendaftaran dari ${actionModal?.reg.business_name}?`}
          </p>
          <Textarea label="Catatan (opsional)" placeholder="Tambahkan catatan untuk peserta..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setActionModal(null); setNotes('') }} className="flex-1">Batal</Button>
            <Button variant={actionModal?.action === 'accepted' ? 'primary' : 'danger'} loading={acting} onClick={handleAction} className="flex-1">
              {actionModal?.action === 'accepted' ? 'Terima' : 'Tolak'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rating untuk UMKM */}
      <UmkmReviewModal
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        event={activeEvent}
        registration={reviewModal?.reg || null}
      />

      {/* Modal Reputasi UMKM */}
      <Modal open={!!reputasiModal} onClose={() => setReputasiModal(null)} title={`Reputasi ${reputasiModal?.name}`} size="xl">
        {reputasiModal && (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <UmkmReviewsList umkmId={reputasiModal.umkmId} showTitle={false} />
          </div>
        )}
      </Modal>

      {/* Modal Chat dengan UMKM */}
      <ChatModal 
        open={!!chatModal} 
        onClose={() => setChatModal(null)} 
        registration={chatModal} 
        chatPartnerName={(chatModal?.profiles as any)?.business_name || (chatModal?.profiles as any)?.full_name || 'UMKM'}
      />
    </div>
  )
}
