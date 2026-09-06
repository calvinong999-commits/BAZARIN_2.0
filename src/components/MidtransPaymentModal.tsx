import { useEffect, useState } from 'react'
import { Modal, Button, Badge, Spinner, Alert } from './ui'
import {
  getOrCreatePayment,
  updatePaymentAndRegistrationStatus,
  createSnapToken,
  loadSnapScript,
} from '../lib/midtrans'
import { useAuth } from '../context/AuthContext'
import type { Event, Registration, Payment } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  registration: Registration | null
  onPaymentSuccess?: () => void
}

export function MidtransPaymentModal({ open, onClose, event, registration, onPaymentSuccess }: Props) {
  const { user } = useAuth()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)

  // Snap (QRIS) state
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapError, setSnapError] = useState<string | null>(null)

  useEffect(() => {
    async function initPayment() {
      if (!open || !event || !registration) return
      setLoading(true)
      setStatusMsg(null)
      setSnapError(null)

      try {
        const payRecord = await getOrCreatePayment(
          registration.id,
          event.id,
          registration.umkm_id,
          event.price || 0
        )
        setPayment(payRecord)
      } catch (err: any) {
        setStatusMsg({ type: 'error', msg: 'Gagal menyiapkan data pembayaran.' })
      } finally {
        setLoading(false)
      }
    }
    initPayment()
  }, [open, event?.id, registration?.id])

  /** Buka Midtrans Snap popup untuk QRIS */
  async function handleOpenSnap(forceNew = false) {
    if (!payment || !event || !user) return
    setSnapLoading(true)
    setSnapError(null)

    // Hapus cache token lama jika forceNew agar benar-benar buat token baru
    if (forceNew) {
      try { localStorage.removeItem(`bzr_snap_${payment.order_id}`) } catch (_) {}
    }

    const customerName = user.profile?.full_name || registration?.business_name || 'UMKM'
    const customerEmail = user.email || 'umkm@bzr.app'
    const amount = event.price || 0
    const baseOrderId = payment.order_id

    const snapResult = await createSnapToken(baseOrderId, amount, customerName, customerEmail, forceNew)
    if (!snapResult?.token) {
      setSnapError(snapResult?.error || 'Gagal mendapatkan token pembayaran')
      setSnapLoading(false)
      return
    }

    const isLoaded = await loadSnapScript()
    if (!isLoaded || !(window as any).snap) {
      setSnapError('Gagal memuat halaman pembayaran. Pastikan koneksi internet stabil dan refresh halaman.')
      setSnapLoading(false)
      return
    }

    setSnapLoading(false)

    ;(window as any).snap.pay(snapResult.token, {
      onSuccess: async (result: any) => {
        console.log('[Snap] onSuccess:', result)
        setProcessing(true)
        if (registration) {
          await updatePaymentAndRegistrationStatus(
            registration.id,
            payment.id || `local-${registration.id}`,
            snapResult.snap_order_id,
            'settlement',
            'qris'
          )
        }
        onPaymentSuccess?.()
      },
      onPending: (result: any) => {
        console.log('[Snap] onPending:', result)
        setSnapError('Pembayaran pending. Selesaikan pembayaran di aplikasi QRIS / e-wallet kamu.')
      },
      onError: (result: any) => {
        console.error('[Snap] onError:', result)
        setSnapError('Pembayaran gagal. Silakan coba lagi.')
      },
      onClose: () => {
        console.log('[Snap] popup closed')
        // Tampilkan pesan agar user bisa retry — bisa jadi expired atau user cancel
        setSnapError('Pembayaran belum selesai atau transaksi kadaluarsa. Klik "Coba Lagi dengan Token Baru" untuk memulai ulang.')
      },
    })
  }


  const isPaid = payment?.transaction_status === 'settlement'
  const amountStr = `Rp ${(event?.price || 0).toLocaleString('id-ID')}`

  if (!open || !event || !registration) return null

  return (
    <Modal open={open} onClose={onClose} title="Pembayaran via QRIS" size="lg">
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Spinner size={32} className="text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Menyiapkan data pembayaran...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header Order Info */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-blue-300">ORDER ID: {payment?.order_id}</span>
              <h3 className="font-black text-lg mt-0.5">{event.title}</h3>
              <p className="text-xs text-slate-300 mt-1">📍 {event.city || event.location || '—'} · 🏪 {registration.business_name || 'UMKM'}</p>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              <p className="text-xs text-slate-400">Total Tagihan</p>
              <p className="text-2xl font-black text-emerald-400">{amountStr}</p>
            </div>
          </div>

          {statusMsg && <Alert type={statusMsg.type} message={statusMsg.msg} />}

          {/* Paid State */}
          {isPaid ? (
            <div className="text-center py-8 space-y-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-200">✓</div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-xl">Pembayaran Berhasil Lunas!</h4>
                <p className="text-sm text-slate-600 mt-1">Tagihan <strong className="text-emerald-700">{amountStr}</strong> telah terverifikasi. Status pendaftaran menjadi <strong className="text-emerald-700">DITERIMA</strong>.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 text-left space-y-2 text-xs text-slate-600 max-w-sm mx-auto font-mono shadow-sm">
                <div className="flex justify-between border-b pb-2 font-bold text-slate-800">
                  <span>BUKTI PEMBAYARAN</span><Badge label="LUNAS" variant="green" />
                </div>
                <div className="flex justify-between"><span>Order ID:</span><span>{payment?.order_id}</span></div>
                <div className="flex justify-between"><span>Metode:</span><span>QRIS</span></div>
                <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleString('id-ID')}</span></div>
              </div>
              <Button onClick={onClose} className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700">Selesai & Tutup</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QRIS Payment Card */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/40 p-5 space-y-5">
                {/* Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 shrink-0">
                    📱
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">Bayar dengan QRIS</h4>
                    <p className="text-xs text-slate-500 mt-0.5">GoPay · OVO · Dana · ShopeePay · m-Banking · semua QRIS</p>
                  </div>
                </div>

                {/* Amount highlight */}
                <div className="bg-white border border-emerald-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total yang harus dibayar</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{amountStr}</p>
                  </div>
                  <div className="flex gap-1.5 text-xl">
                    <span title="QRIS">📷</span>
                    <span title="GoPay">💚</span>
                    <span title="OVO">💜</span>
                    <span title="Dana">🔵</span>
                    <span title="ShopeePay">🧡</span>
                  </div>
                </div>

                {/* Error */}
                {snapError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    ⚠️ {snapError}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-2">
                  <Button
                    loading={snapLoading}
                    onClick={() => handleOpenSnap(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3"
                  >
                    {snapLoading ? 'Menyiapkan pembayaran...' : '📱 Bayar Sekarang dengan QRIS'}
                  </Button>

                  {snapError && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenSnap(true)}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                    >
                      🔄 Buat Transaksi Baru &amp; Coba Lagi
                    </Button>
                  )}
                </div>

                {/* How to pay */}
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700">📌 Cara Pembayaran:</p>
                  <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
                    <li>Klik <strong>"Bayar Sekarang dengan QRIS"</strong> di atas</li>
                    <li>Popup pembayaran akan terbuka — pilih QRIS atau e-wallet</li>
                    <li>Scan QR code atau selesaikan di aplikasi pilihan kamu</li>
                    <li>Status pendaftaran akan otomatis terupdate setelah pembayaran berhasil</li>
                  </ol>
                </div>

                {processing && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Spinner size={18} className="text-emerald-500" />
                    <p className="text-xs text-slate-500 font-medium">Memproses pembayaran...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
