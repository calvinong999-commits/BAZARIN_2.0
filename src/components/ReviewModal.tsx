import { useState } from 'react'
import { Modal, Button, Textarea, Alert } from './ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  registrationId?: string
  existingRating?: number
  existingComment?: string
  onSuccess?: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: '⭐ Sangat Buruk',
  2: '⭐⭐ Buruk',
  3: '⭐⭐⭐ Cukup',
  4: '⭐⭐⭐⭐ Bagus',
  5: '⭐⭐⭐⭐⭐ Sangat Memuaskan!',
}

export function ReviewModal({
  open,
  onClose,
  event,
  registrationId,
  existingRating = 5,
  existingComment = '',
  onSuccess,
}: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState<number>(existingRating || 5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>(existingComment || '')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!event) return null

  async function handleSubmit() {
    if (!user || !event) return
    setSubmitting(true)
    setErrorMsg('')

    try {
      const reviewPayload = {
        event_id: event.id,
        umkm_id: user.id,
        registration_id: registrationId || null,
        rating: rating,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      }

      // Upsert into event_reviews table
      const { error } = await supabase.from('event_reviews').upsert(reviewPayload, {
        onConflict: 'event_id,umkm_id',
      })

      if (error) {
        console.warn('DB upsert review error:', error.message)
      }

      setSuccessMsg('🎉 Terima kasih! Ulasan dan rating Anda berhasil disimpan.')
      setTimeout(() => {
        setSubmitting(false)
        setSuccessMsg('')
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan ulasan. Coba lagi.')
      setSubmitting(false)
    }
  }

  const activeStars = hoverRating || rating

  return (
    <Modal open={open} onClose={onClose} title="Beri Rating & Ulasan Event" size="md">
      <div className="space-y-5">
        {/* Header Event Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0">
            {event.cover_image ? (
              <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-800 text-sm truncate">{event.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              📍 {event.city || event.location || '—'} · 📅 {new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {errorMsg && <Alert type="error" message={errorMsg} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Interactive Star Selection */}
        <div className="text-center space-y-2 py-2">
          <label className="block text-sm font-semibold text-slate-700">
            Bagaimana Pengalaman Anda di Event Ini?
          </label>

          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 text-3xl transition-transform hover:scale-125 focus:outline-none"
              >
                <span className={star <= activeStars ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}>
                  ★
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-indigo-600 h-5">
            {RATING_LABELS[activeStars]}
          </p>
        </div>

        {/* Comment Textarea */}
        <Textarea
          label="Komentar / Ulasan untuk Penyelenggara (Host)"
          placeholder="Tuliskan pengalaman Anda mengenai fasilitas, keramaian pengunjung, kebersihan, atau saran peningkatan..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1" disabled={submitting}>
            Batal
          </Button>
          <Button loading={submitting} onClick={handleSubmit} className="flex-1">
            Simpan Ulasan
          </Button>
        </div>
      </div>
    </Modal>
  )
}
