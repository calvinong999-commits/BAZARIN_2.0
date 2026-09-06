import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Avatar, Spinner, Empty } from './ui'
import type { UmkmReview } from '../lib/types'

interface Props {
  umkmId: string
  showTitle?: boolean
}

export function UmkmReviewsList({ umkmId, showTitle = true }: Props) {
  const [reviews, setReviews] = useState<UmkmReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReviews() {
      setLoading(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from('umkm_reviews')
        .select('*, profiles!host_id(full_name, business_name, avatar_url, city), events(title)')
        .eq('umkm_id', umkmId)
        .order('created_at', { ascending: false })

      if (error) {
        setFetchError(error.message)
      }

      setReviews((data || []) as UmkmReview[])
      setLoading(false)
    }

    if (umkmId) {
      loadReviews()
    }
  }, [umkmId])

  const totalReviews = reviews.length
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0'

  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={24} className="text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Reputasi & Ulasan UMKM</h3>
            <p className="text-xs text-slate-500 mt-0.5">Penilaian dari Host Event</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-full border border-emerald-200">
            ★ {avgRating} ({totalReviews} ulasan)
          </span>
        </div>
      )}

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-mono">
          ⚠️ Error fetch: {fetchError}
        </div>
      )}

      {totalReviews === 0 ? (
        <Card className="p-8">
          <Empty
            icon="⭐"
            title="Belum ada ulasan"
            sub={fetchError ? `Gagal memuat data: ${fetchError}` : "UMKM ini belum memiliki ulasan dari Host event manapun."}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Breakdown Card */}
          <Card className="p-5 bg-gradient-to-br from-slate-900 to-teal-950 text-white border-0 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left sm:pr-6 sm:border-r sm:border-slate-800 shrink-0">
                <div className="text-5xl font-black text-amber-400">{avgRating}</div>
                <div className="flex justify-center sm:justify-start text-amber-400 text-lg my-1">
                  {'★'.repeat(Math.round(Number(avgRating))) +
                    '☆'.repeat(5 - Math.round(Number(avgRating)))}
                </div>
                <p className="text-xs text-slate-400">Berdasarkan {totalReviews} ulasan</p>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                {ratingCounts.map(({ star, count }) => {
                  const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                  return (
                    <button
                      key={star}
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`w-full flex items-center gap-2 text-xs transition-opacity hover:opacity-100 ${
                        filterRating && filterRating !== star ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span className="w-8 text-right font-medium text-slate-300">{star} ★</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-6 text-slate-400 font-mono text-[10px]">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterRating(null)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                filterRating === null
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Semua ({totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  filterRating === star
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {star} ★ ({reviews.filter((r) => r.rating === star).length})
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {filteredReviews.map((rev) => {
              const hostProfile = rev.profiles as any
              const eventInfo = rev.events as any
              return (
                <Card key={rev.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={hostProfile?.full_name || hostProfile?.business_name || 'Host'}
                      url={hostProfile?.avatar_url}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {hostProfile?.full_name || hostProfile?.business_name || 'Host Event'}
                          </h4>
                          <p className="text-xs text-emerald-600 font-medium">Event: {eventInfo?.title || 'Unknown Event'}</p>
                        </div>
                        <div className="text-amber-400 font-bold text-sm bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>

                      {rev.comment ? (
                        <p className="text-slate-700 text-sm mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      ) : (
                        <p className="text-slate-400 text-xs italic mt-1">
                          Tidak ada catatan komentar.
                        </p>
                      )}

                      <p className="text-[11px] text-slate-400 mt-2 font-mono">
                        {new Date(rev.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
