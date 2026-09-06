import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card, Spinner, Empty, Badge, Button, StatCard } from '../../components/ui'
import { MidtransPaymentModal } from '../../components/MidtransPaymentModal'
import { getLocalPaymentOverride, checkPaymentStatus, updatePaymentAndRegistrationStatus } from '../../lib/midtrans'
import type { Payment, Registration, Event } from '../../lib/types'

export function PaymentPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // Selected item for payment modal
  const [payModal, setPayModal] = useState<{
    event: Event
    registration: Registration
  } | null>(null)

  const [checkingStatus, setCheckingStatus] = useState<string | null>(null)

  async function handleCheckStatus(pay: Payment, reg: Registration) {
    if (!pay.order_id) return
    setCheckingStatus(pay.id)
    try {
      const data = await checkPaymentStatus(pay.order_id)
      if (data && (data.transaction_status === 'settlement' || data.transaction_status === 'capture')) {
        await updatePaymentAndRegistrationStatus(
          pay.registration_id,
          pay.id,
          pay.order_id,
          'settlement',
          data.payment_type || pay.payment_type
        )
        // Refresh
        await loadPayments()
        alert('Pembayaran berhasil dikonfirmasi! Status pendaftaran telah diupdate.')
      } else if (data && (data.transaction_status === 'expire' || data.transaction_status === 'cancel')) {
        await updatePaymentAndRegistrationStatus(
          pay.registration_id,
          pay.id,
          pay.order_id,
          'cancel',
          data.payment_type || pay.payment_type
        )
        await loadPayments()
        alert('Pembayaran telah expire atau dibatalkan.')
      } else {
        alert(`Status saat ini: ${data.transaction_status || 'Belum dibayar'}`)
      }
    } catch (e) {
      console.error(e)
      alert('Gagal mengecek status pembayaran')
    }
    setCheckingStatus(null)
  }

  async function loadPayments() {
    if (!user) return
    setLoading(true)

    // Load payments joined with events and registrations
    const { data } = await supabase
      .from('payments')
      .select('*, events(*), registrations(*)')
      .eq('umkm_id', user.id)
      .order('created_at', { ascending: false })

    const rawPayments = (data || []) as Payment[]
    const updated = rawPayments.map((p) => {
      const override = getLocalPaymentOverride(p.registration_id)
      if (override) {
        return { ...p, ...override } as Payment
      }
      return p
    })

    setPayments(updated)
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
  }, [user])

  const totalSpent = payments
    .filter((p) => p.transaction_status === 'settlement')
    .reduce((acc, p) => acc + (p.gross_amount || 0), 0)

  const pendingCount = payments.filter((p) => p.transaction_status === 'pending').length
  const successCount = payments.filter((p) => p.transaction_status === 'settlement').length

  const filteredPayments =
    filter === 'all'
      ? payments
      : payments.filter((p) => p.transaction_status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size={32} className="text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Transaksi & Pembayaran QRIS</h2>
            <p className="text-blue-100 text-sm mt-1">
              Kelola pembayaran pendaftaran event bazaar Anda via QRIS
            </p>
          </div>
          <div className="hidden sm:block text-3xl">📱</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Pembayaran"
          value={`Rp ${totalSpent.toLocaleString('id-ID')}`}
          icon="💰"
          color="green"
          sub="Transaksi berhasil"
        />
        <StatCard
          label="Transaksi Sukses"
          value={successCount}
          icon="✅"
          color="blue"
          sub="Status lunas"
        />
        <StatCard
          label="Menunggu Bayar"
          value={pendingCount}
          icon="⏳"
          color="amber"
          sub="Perlu diselesaikan"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { k: 'all', l: 'Semua Transaksi' },
          { k: 'pending', l: 'Menunggu Pembayaran' },
          { k: 'settlement', l: 'Lunas / Sukses' },
          { k: 'expire', l: 'Kadaluarsa / Batal' },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              filter === f.k
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
            }`}
          >
            {f.l}{' '}
            {f.k === 'all'
              ? `(${payments.length})`
              : `(${payments.filter((p) => p.transaction_status === f.k).length})`}
          </button>
        ))}
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card className="p-12">
          <Empty
            icon="🧾"
            title="Belum ada catatan transaksi"
            sub="Setiap pendaftaran event berbayar akan memunculkan invoice pembayaran di sini."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((pay) => {
            const event = pay.events as any
            const reg = pay.registrations as any
            const isPaid = pay.transaction_status === 'settlement'
            const isPending = pay.transaction_status === 'pending'

            return (
              <Card key={pay.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                      {event?.cover_image ? (
                        <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{pay.order_id}</span>
                        {isPaid ? (
                          <Badge label="LUNAS" variant="green" dot />
                        ) : isPending ? (
                          <Badge label="MENUNGGU BAYAR" variant="amber" dot />
                        ) : (
                          <Badge label="BATAL" variant="red" dot />
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{event?.title || 'Event BZR'}</h3>
                      <p className="text-xs text-slate-500">
                        📍 {event?.city || event?.location || '—'} · 📅{' '}
                        {new Date(pay.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Total Tagihan</p>
                      <p className="text-lg font-black text-blue-600">
                        Rp {(pay.gross_amount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {isPending && event && reg && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={checkingStatus === pay.id}
                          onClick={() => handleCheckStatus(pay, reg)}
                        >
                          🔄 Cek Status
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setPayModal({ event, registration: reg })}
                        >
                          💳 Bayar Sekarang
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <MidtransPaymentModal
          open={!!payModal}
          onClose={() => setPayModal(null)}
          event={payModal.event}
          registration={payModal.registration}
          onPaymentSuccess={() => {
            setPayModal(null)
            loadPayments()
          }}
        />
      )}
    </div>
  )
}
