import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, Empty, Spinner, Avatar } from '../components/ui'
import { ChatModal } from '../components/ChatModal'
import type { Conversation } from '../lib/types'

export function InboxPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)

  const isHost = user?.profile?.role === 'host'

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user])

  async function loadConversations() {
    setLoading(true)
    const filterField = isHost ? 'host_id' : 'umkm_id'

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        events(id, title, cover_image),
        host_profile:profiles!conversations_host_id_fkey(id, full_name, business_name, avatar_url),
        umkm_profile:profiles!conversations_umkm_id_fkey(id, full_name, business_name, avatar_url)
      `)
      .eq(filterField, user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // For each conversation, get the last message
      const convsWithLastMsg = await Promise.all(
        (data as any[]).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          return { ...conv, last_message: lastMsg || null }
        })
      )
      setConversations(convsWithLastMsg as Conversation[])
    }
    setLoading(false)
  }

  function getPartnerProfile(conv: Conversation) {
    return isHost ? (conv as any).umkm_profile : (conv as any).host_profile
  }

  function getPartnerName(conv: Conversation) {
    const p = getPartnerProfile(conv)
    return p?.business_name || p?.full_name || (isHost ? 'UMKM' : 'Host')
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Inbox Chat</h2>
        <p className="text-sm text-slate-400 mt-0.5">Semua percakapan kamu dengan {isHost ? 'UMKM' : 'Host'}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Spinner size={28} className="text-blue-600" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="p-12">
          <Empty
            icon="💬"
            title="Belum ada percakapan"
            sub={isHost
              ? "UMKM yang tertarik dengan event kamu akan menghubungi kamu di sini."
              : "Mulai chat dengan Host dari halaman Jelajah Event untuk negosiasi sebelum mendaftar."
            }
          />
          {!isHost && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/browse')}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                → Jelajahi Event Sekarang
              </button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const partner = getPartnerProfile(conv)
            const partnerName = getPartnerName(conv)
            const lastMsg = (conv as any).last_message
            const event = (conv as any).events

            return (
              <Card
                key={conv.id}
                className="p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                onClick={() => setActiveConv(conv)}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={partnerName}
                    url={partner?.avatar_url}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 text-sm truncate">{partnerName}</p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(lastMsg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-600 font-medium truncate mt-0.5">
                      🎪 {event?.title || 'Event'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {lastMsg
                        ? (lastMsg.sender_id === user?.id ? 'Anda: ' : '') + lastMsg.content
                        : 'Belum ada pesan. Mulai percakapan!'}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-300 shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Chat Modal */}
      {activeConv && (
        <ChatModal
          open={!!activeConv}
          onClose={() => { setActiveConv(null); loadConversations() }}
          conversationId={activeConv.id}
          chatPartnerName={getPartnerName(activeConv)}
          chatPartnerAvatar={getPartnerProfile(activeConv)?.avatar_url}
        />
      )}
    </div>
  )
}
