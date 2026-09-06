import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card, Empty, Spinner, StatusBadge, Button, Badge } from '../../components/ui'
import { MidtransPaymentModal } from '../../components/MidtransPaymentModal'
import { ReviewModal } from '../../components/ReviewModal'
import { ChatModal } from '../../components/ChatModal'
import { getLocalPaymentOverride } from '../../lib/midtrans'
import type { Registration, Event, Payment, EventReview } from '../../lib/types'

export function MyRegistrations() {
  const { user } = useAuth()
  const [regs, setRegs] = useState<Registration[]>([])
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment>>({})
  const [reviewsMap, setReviewsMap] = useState<Record<string, EventReview>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Payment Modal State
  const [payTarget, setPayTarget] = useState<{ event: Event; registration: Registration } | null>(null)

  // Review Modal State
  const [reviewTarget, setReviewTarget] = useState<{ event: Event; registration: Registration } | null>(null)

  // Chat Modal State
  const [chatModal, setChatModal] = useState<Registration | null>(null)

  async function loadData() {
    if (!user) return
    setLoading(true)

    // Load registrations
    const { data: regData } = await supabase
      .from('registrations')
      .select('*, events(*, profiles(*))')
      .eq('umkm_id', user.id)
      .order('created_at', { ascending: false })

    const rawRegs = (regData || []) as Registration[]
    const regList = rawRegs.map((r) => {
      const override = getLocalPaymentOverride(r.id)
      if (override?.transaction_status === 'settlement') {
        return { ...r, status: 'accepted' as const }
      }
      return r
    })
    setRegs(regList)

    // Load payments for user
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .eq('umkm_id', user.id)

    const pMap: Record<string, Payment> = {}
    if (payData) {
      payData.forEach((p: any) => {
        const override = getLocalPaymentOverride(p.registration_id)
        pMap[p.registration_id] = override ? { ...p, ...override } : p
      })
    }
    // Also inject any local-only payments
    regList.forEach((r) => {
      const override = getLocalPaymentOverride(r.id)
      if (override && !pMap[r.id]) {
        pMap[r.id] = {
          id: `local-pay-${r.id}`,
          registration_id: r.id,
          event_id: r.event_id,
          umkm_id: user.id,
          order_id: `BZR-${Date.now()}`,
          gross_amount: (r.events as any)?.price || 0,
          payment_type: override.payment_type || 'midtrans',
          transaction_status: (override.transaction_status || 'settlement') as any,
          snap_token: null,
          payment_url: null,
          created_at: new Date().toISOString(),
        }
      }
    })
    setPaymentsMap(pMap)

    // Load reviews for user
    const { data: revData } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('umkm_id', user.id)

    if (revData) {
      const rMap: Record<string, EventReview> = {}
      revData.forEach((r: any) => {
        rMap[r.event_id] = r
      })
      setReviewsMap(rMap)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const filtered = filter === 'all' ? regs : regs.filter((r) => r.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Spinner size={28} className="text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Pendaftaran Saya</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { k: 'all', l: 'Semua' },
          { k: 'pending', l: 'Menunggu' },
          { k: 'accepted', l: 'Diterima' },
          { k: 'rejected', l: 'Ditolak' },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              filter === f.k
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 text-slate-600 hover:border-blue-400'
            }`}
          >
            {f.l}{' '}
            {f.k === 'all'
              ? `(${regs.length})`
              : `(${regs.filter((r) => r.status === f.k).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12">
          <Empty
            icon="📋"
            title="Tidak ada pendaftaran"
            sub="Daftar ke event untuk melihat status di sini"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const event = reg.events as any
            const hostProfile = event?.profiles
            const pay = paymentsMap[reg.id]
            const existingReview = reviewsMap[event?.id]

            const isPaid = pay?.transaction_status === 'settlement'
            const now = new Date()
            // Event sudah mulai (tanggal hari ini >= start_date)
            const eventStarted = event?.start_date && now >= new Date(event.start_date)
            // Event sudah berakhir
            const isEventEnded =
              event?.status === 'completed' ||
              (event?.end_date && new Date(event.end_date) <= now)

            const price = event?.price || 0
            const requiresPayment = price > 0
            // Rating hanya bisa diberikan setelah event dimulai & UMKM diterima
            const canReview = reg.status === 'accepted' && eventStarted

            return (
              <Card key={reg.id} className="p-5">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                    {event?.cover_image ? (
                      <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{event?.title || '—'}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                          Biaya: {price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <StatusBadge status={reg.status} />
                        {requiresPayment && reg.status === 'accepted' && (
                          isPaid ? (
                            <Badge label="LUNAS" variant="green" />
                          ) : (
                            <Badge label="BELUM BAYAR" variant="amber" />
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      📅 {event?.start_date ? new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      {' - '}
                      {event?.end_date ? new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">📍 {event?.city || event?.location || '—'}</p>

                    {(hostProfile?.phone || event?.contact_phone) && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          📞 {hostProfile?.phone || event?.contact_phone}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setChatModal(reg)}
                          className="text-[10px] h-6 px-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"
                        >
                          💬 Chat Host
                        </Button>
                      </div>
                    )}

                    {reg.host_notes && (
                      <div className={`text-xs px-3 py-2 rounded-xl ${reg.status === 'rejected' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                        <strong>Catatan Host:</strong> {reg.host_notes}
                      </div>
                    )}

                    {/* Existing Review Badge Preview */}
                    {existingReview && (
                      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                          <span>Ulasan Anda: {'★'.repeat(existingReview.rating)}</span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-500 font-mono">
                            {new Date(existingReview.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {existingReview.comment && (
                          <p className="text-slate-700 dark:text-slate-300 italic">"{existingReview.comment}"</p>
                        )}
                      </div>
                    )}

                    {/* Info & Action buttons area */}
                    <div className="flex flex-col gap-2 pt-2">

                      {/* Pending — waiting for host */}
                      {reg.status === 'pending' && (
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                          ⏳ <span>Menunggu persetujuan host. Pembayaran akan tersedia setelah diterima.</span>
                        </div>
                      )}

                      {/* Rejected */}
                      {reg.status === 'rejected' && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-400">
                          ❌ <span>Pendaftaran ditolak. Kamu tidak dapat melanjutkan pembayaran.</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Payment button — only when accepted & not yet paid */}
                        {requiresPayment && !isPaid && reg.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => setPayTarget({ event, registration: reg })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            📱 Bayar Sekarang via QRIS
                          </Button>
                        )}

                        {/* Post-Event Rating / Review Button — hanya setelah event mulai */}
                        {canReview && (
                          <Button
                            size="sm"
                            variant={existingReview ? 'outline' : 'primary'}
                            onClick={() => setReviewTarget({ event, registration: reg })}
                            className={existingReview ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                          >
                            ⭐ {existingReview ? 'Edit Rating & Ulasan' : 'Beri Rating & Ulasan'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Midtrans Payment Modal */}
      {payTarget && (
        <MidtransPaymentModal
          open={!!payTarget}
          onClose={() => setPayTarget(null)}
          event={payTarget.event}
          registration={payTarget.registration}
          onPaymentSuccess={() => {
            setPayTarget(null)
            loadData()
          }}
        />
      )}

      {/* Post Event Review Modal */}
      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          event={reviewTarget.event}
          registrationId={reviewTarget.registration.id}
          existingRating={reviewsMap[reviewTarget.event.id]?.rating}
          existingComment={reviewsMap[reviewTarget.event.id]?.comment || ''}
          onSuccess={() => {
            setReviewTarget(null)
            loadData()
          }}
        />
      )}

      <ChatModal 
        open={!!chatModal} 
        onClose={() => setChatModal(null)} 
        registration={chatModal} 
        chatPartnerName={(chatModal?.events as any)?.profiles?.business_name || (chatModal?.events as any)?.profiles?.full_name || 'Host'}
      />
    </div>
  )
}
