import { useEffect, useState, useRef } from 'react'
import { Modal, Button, Avatar, Spinner } from './ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ChatMessage } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  conversationId?: string | null
  registrationId?: string | null
  chatPartnerName?: string
  chatPartnerAvatar?: string | null
}

export function ChatModal({
  open,
  onClose,
  conversationId,
  registrationId,
  chatPartnerName = 'User',
  chatPartnerAvatar,
}: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!open || !user) return
    if (!conversationId && !registrationId) return

    async function loadMessages() {
      setLoading(true)
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (conversationId) {
        query = query.eq('conversation_id', conversationId)
      } else if (registrationId) {
        query = query.eq('registration_id', registrationId)
      }

      const { data, error } = await query
      if (!error && data) {
        setMessages(data as ChatMessage[])
      }
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    loadMessages()

    const channelKey = conversationId ? `conv_${conversationId}` : `reg_${registrationId}`
    const filterField = conversationId ? 'conversation_id' : 'registration_id'
    const filterValue = conversationId || registrationId

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `${filterField}=eq.${filterValue}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, business_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          const completeMsg = { ...newMsg, profiles: profileData || undefined }
          setMessages((prev) => {
            if (prev.find((m) => m.id === completeMsg.id)) return prev
            return [...prev, completeMsg as ChatMessage]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, conversationId, registrationId, user])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim() || !user) return

    setSending(true)
    const msg = inputText.trim()
    setInputText('')

    const payload: any = {
      sender_id: user.id,
      content: msg,
    }
    if (conversationId) payload.conversation_id = conversationId
    if (registrationId) payload.registration_id = registrationId

    const { data, error } = await supabase.from('chat_messages').insert(payload).select().single()

    if (error) {
      console.error('Error sending message:', error)
      setInputText(msg)
    } else if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev
        return [...prev, { ...data, profiles: user.profile }]
      })
      setTimeout(scrollToBottom, 100)
    }
    setSending(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={`💬 Chat dengan ${chatPartnerName}`} size="md">
      <div className="flex flex-col h-[60vh] -mx-6 -mb-6 bg-slate-50">

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size={24} className="text-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <span className="text-4xl">👋</span>
              <p className="text-sm font-medium">Mulai percakapan dengan {chatPartnerName}</p>
              <p className="text-xs text-center max-w-[200px]">Tanyakan detail event, harga, atau ketersediaan booth</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id
              const senderName = isMe
                ? 'Anda'
                : msg.profiles?.business_name || msg.profiles?.full_name || chatPartnerName

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isMe && (
                    <Avatar
                      size={30}
                      name={senderName}
                      url={msg.profiles?.avatar_url || chatPartnerAvatar}
                    />
                  )}
                  <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] font-semibold mb-0.5 px-1 ${isMe ? 'text-blue-500' : 'text-slate-500'}`}>
                      {senderName}
                    </span>
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-3 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e as any) }}
              placeholder="Tulis pesan..."
              className="flex-1 bg-slate-100 border-none outline-none focus:ring-2 focus:ring-blue-500/20 rounded-full px-4 py-2.5 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 transition-all"
            >
              {sending ? (
                <Spinner size={16} className="text-white" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </form>
        </div>

      </div>
    </Modal>
  )
}
