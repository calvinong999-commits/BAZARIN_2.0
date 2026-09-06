import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Badge, Button, Card, Empty, Input, Modal, Select, Spinner, Textarea } from '../../components/ui'
import { ChatModal } from '../../components/ChatModal'
import { SecureDocumentViewer } from '../../components/SecureDocumentViewer'
import { SponsorBanner } from '../../components/SponsorBanner'
import type { Category, Event, Stand } from '../../lib/types'

export function BrowseEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [registerModal, setRegisterModal] = useState<Event | null>(null)
  const [regForm, setRegForm] = useState({
    business_name: '', phone: '', product_type: '', notes: '', address: ''
  })
  // regStep: 1 = isi data, 2 = pilih stand, 3 = syarat & ketentuan
  const [regStep, setRegStep] = useState(1)
  const [stands, setStands] = useState<Stand[]>([])
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set())
  const [regSuccessMsg, setRegSuccessMsg] = useState<string>('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Chat state
  const [chatModal, setChatModal] = useState<{ convId: string; partnerName: string; partnerAvatar?: string } | null>(null)
  const [startingChat, setStartingChat] = useState<string | null>(null) // eventId being chatted
  
  // Document Viewer state
  const [docViewer, setDocViewer] = useState<{ url: string; title: string } | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('events').select('*, categories(name, icon), profiles(full_name, phone)').eq('status', 'published').order('start_date')
    if (city) q = q.ilike('city', `%${city}%`)
    if (catFilter) q = q.eq('category_id', catFilter)
    if (dateFilter) q = q.gte('start_date', dateFilter).lte('end_date', dateFilter)
    const { data } = await q
    let evts = (data || []) as Event[]
    if (search) evts = evts.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.city?.toLowerCase().includes(search.toLowerCase()))
    setEvents(evts)
    setLoading(false)
  }, [search, city, catFilter, dateFilter])

  useEffect(() => { loadEvents() }, [loadEvents])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data || []) as Category[]))
    if (user) {
      supabase.from('registrations').select('event_id').eq('umkm_id', user.id)
        .then(({ data }) => setMyRegistrations(new Set((data || []).map((r: any) => r.event_id))))
    }
  }, [user])

  async function handleStartChat(event: Event) {
    if (!user) return
    setStartingChat(event.id)
    const hostProfile = (event as any).profiles
    const partnerName = hostProfile?.business_name || hostProfile?.full_name || 'Host'

    const { data: conv, error } = await supabase
      .from('conversations')
      .upsert(
        { event_id: event.id, host_id: event.host_id, umkm_id: user.id },
        { onConflict: 'event_id,umkm_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    setStartingChat(null)
    if (!error && conv) {
      setChatModal({ convId: conv.id, partnerName, partnerAvatar: hostProfile?.avatar_url })
    }
  }

  async function handleNextStep() {
    if (!registerModal) return
    setSubmitting(true)
    const { data } = await supabase.from('event_stands').select('*').eq('event_id', registerModal.id).eq('is_available', true)
    
    const sortedStands = (data as Stand[] || []).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )
    
    setStands(sortedStands)
    setSubmitting(false)
    setRegStep(2)
  }

  function handleGoToTerms() {
    // If event has terms, go to step 3, else submit directly
    if (registerModal?.terms_conditions) {
      setAgreedToTerms(false)
      setRegStep(3)
    } else {
      handleRegister()
    }
  }

  async function handleRegister() {
    if (!registerModal || !user) return
    setSubmitting(true)

    let ktpUrl = null
    if (ktpFile) {
      const ext = ktpFile.name.split('.').pop()
      const fileName = `ktp-${user.id}-${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('bzr-media').upload(fileName, ktpFile)
      if (uploadData) {
        const { data: publicUrlData } = supabase.storage.from('bzr-media').getPublicUrl(fileName)
        ktpUrl = publicUrlData.publicUrl
      }
    }

    const regData = {
      event_id: registerModal.id, umkm_id: user.id,
      business_name: regForm.business_name || user.profile?.business_name || null,
      phone: regForm.phone || user.profile?.phone || null,
      address: regForm.address || null,
      ktp_url: ktpUrl,
      product_type: regForm.product_type || null,
      notes: regForm.notes || null,
      stand_id: selectedStand?.id || null,
      status: 'pending' as const,
    }

    const { data: createdReg, error: insertError } = await supabase.from('registrations').insert(regData).select().single()

    if (insertError) {
      console.error('Insert Error:', insertError)
      alert('Gagal mendaftar: ' + insertError.message)
      setSubmitting(false)
      return
    }

    if (selectedStand) {
      await supabase.from('event_stands').update({ is_available: false }).eq('id', selectedStand.id)
    }

    setMyRegistrations(prev => new Set([...prev, registerModal.id]))
    setSubmitting(false)
    const currentEvent = registerModal
    setRegisterModal(null)
    setRegSuccess(true)
    setRegForm({ business_name: '', phone: '', product_type: '', notes: '', address: '' })
    setKtpFile(null)

    const finalPrice = selectedStand ? Number(selectedStand.price) : Number(currentEvent.price)

    if (finalPrice > 0) {
      setRegSuccessMsg('Pendaftaran berhasil dikirim! Tunggu persetujuan host. Pembayaran akan tersedia setelah diterima.')
    } else {
      setRegSuccessMsg('Pendaftaran gratis berhasil dikirim!')
    }
    setTimeout(() => setRegSuccessMsg(''), 5000)
  }

  function openRegister(e: Event) {
    setRegForm({
      business_name: user?.profile?.business_name || '',
      phone: user?.profile?.phone || '',
      address: user?.profile?.city || '',
      product_type: '',
      notes: '',
    })
    setKtpFile(null)
    setRegStep(1)
    setSelectedStand(null)
    setStands([])
    setAgreedToTerms(false)
    setRegisterModal(e)
  }

  return (
    <div className="space-y-5">
      {/* Success toast */}
      {regSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-[slideIn_0.3s_ease]">
          ✅ Pendaftaran berhasil dikirim!
        </div>
      )}

      {/* Info toast for paid events */}
      {regSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-blue-700 text-white font-medium text-sm px-5 py-3 rounded-2xl shadow-xl flex items-start gap-3 animate-[slideIn_0.3s_ease]">
          <span className="text-xl mt-0.5">📋</span>
          <span>{regSuccessMsg}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200/40 dark:shadow-blue-900/40">
        <h2 className="text-2xl font-bold">Jelajahi Event</h2>
        <p className="text-blue-200 text-sm mt-1">Temukan event bazaar dan festival terdekat</p>
        <div className="mt-4">
          <Input placeholder="🔍 Cari nama event atau kota..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:ring-white/40 dark:bg-white/10 dark:border-white/20" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="🏙️ Kota" value={city} onChange={e => setCity(e.target.value)} className="flex-1 min-w-32" />
        <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="flex-1 min-w-40">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </Select>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="flex-1 min-w-36" />
        {(city || catFilter || dateFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setCity(''); setCatFilter(''); setDateFilter('') }}>✕ Reset</Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>
      ) : events.length === 0 ? (
        <Card className="p-12">
          <Empty icon="🔍" title="Tidak ada event" sub="Coba ubah filter pencarian" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map(e => {
            const cat = (e as any).categories
            const alreadyJoined = myRegistrations.has(e.id)
            return (
              <Card key={e.id} className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                <div className="relative h-44 bg-slate-100 dark:bg-slate-700">
                  {e.cover_image
                    ? <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">🎪</div>}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {cat && <Badge label={`${cat.icon || ''} ${cat.name}`} variant="blue" />}
                    {e.price === 0 && <Badge label="Gratis" variant="green" />}
                  </div>
                  {alreadyJoined && (
                    <div className="absolute top-3 right-3"><Badge label="Didaftarkan" variant="purple" /></div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{e.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">📅 {new Date(e.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">📍 {e.city || e.location || '—'}</p>
                  
                  {((e as any).profiles?.phone || e.contact_phone) && (() => {
                    const phone = (e as any).profiles?.phone || e.contact_phone;
                    const waPhone = phone.replace(/[^0-9]/g, '');
                    return (
                      <div className="flex items-center gap-1.5 mt-1 bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-600">
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase font-bold">WhatsApp Host</span>
                        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                          📞 {phone}
                        </a>
                      </div>
                    )
                  })()}

                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    {/* Document Links */}
                    {(e.proposal_url || e.izin_url) && (
                      <div className="flex gap-2 mb-2">
                        {e.izin_url && (
                          <button type="button" onClick={(ev) => { ev.stopPropagation(); setDocViewer({ url: e.izin_url!, title: 'Surat Izin Event' }) }} className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-lg border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                            📄 Surat Izin
                          </button>
                        )}
                        {e.proposal_url && (
                          <button type="button" onClick={(ev) => { ev.stopPropagation(); setDocViewer({ url: e.proposal_url!, title: 'Proposal Event' }) }} className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                            📄 Proposal
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{e.price === 0 ? 'Gratis' : `Rp ${e.price.toLocaleString('id-ID')}`}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{e.available_slots} slot tersisa</p>
                      </div>
                      <Button size="sm" disabled={alreadyJoined || e.available_slots === 0}
                        onClick={() => openRegister(e)}>
                        {alreadyJoined ? '✓ Didaftar' : e.available_slots === 0 ? 'Penuh' : 'Daftar'}
                      </Button>
                    </div>
                    {/* Tanya Host Button */}
                    {user && (
                      <button
                        onClick={() => handleStartChat(e)}
                        disabled={startingChat === e.id}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all disabled:opacity-50"
                      >
                        {startingChat === e.id ? (
                          <><span className="animate-spin">⏳</span> Membuka chat...</>
                        ) : (
                          <><span>💬</span> Tanya Host dulu</>  
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Register Modal */}
      <Modal open={!!registerModal} onClose={() => setRegisterModal(null)} title="Daftar ke Event" size="md">
        {registerModal && (
          <div className="space-y-4">
            {/* Event preview */}
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-3 flex gap-3 items-center">
              {registerModal.cover_image && <img src={registerModal.cover_image} alt="" className="w-14 h-14 object-cover rounded-xl" />}
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{registerModal.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(registerModal.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {registerModal.city}</p>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2">
              {[1, 2, ...(registerModal.terms_conditions ? [3] : [])].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${regStep >= s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>

            {/* Step 1: Data UMKM */}
            {regStep === 1 && (
              <div className="space-y-4 animate-[slideIn_0.2s_ease]">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Langkah 1: Data Usaha Kamu</h3>
                <Input label="Nama UMKM/Usaha *" value={regForm.business_name} onChange={e => setRegForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Nama usaha kamu" required />
                <Input label="Nomor Telepon *" type="tel" value={regForm.phone} onChange={e => {
                  let v = e.target.value.replace(/[^0-9]/g, '')
                  if (v.startsWith('62')) v = v.substring(2)
                  else if (v.startsWith('0')) v = v.substring(1)
                  if (v.length > 13) v = v.substring(0, 13)
                  setRegForm(f => ({ ...f, phone: v ? `+62${v}` : '' }))
                }} placeholder="+628123456789" required />
                <Input label="Alamat Lengkap *" value={regForm.address} onChange={e => setRegForm(f => ({ ...f, address: e.target.value }))} placeholder="Alamat detail (Jalan, RT/RW, Kota)" required />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto KTP *</label>
                  <input type="file" accept="image/*" onChange={e => setKtpFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer" required />
                </div>
                <Input label="Jenis Produk *" value={regForm.product_type} onChange={e => setRegForm(f => ({ ...f, product_type: e.target.value }))} placeholder="Fashion, Kuliner, Kerajinan..." required />
                <Textarea label="Catatan (opsional)" value={regForm.notes} onChange={e => setRegForm(f => ({ ...f, notes: e.target.value }))} placeholder="Info tambahan untuk host..." rows={2} />
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setRegisterModal(null)} className="flex-1">Batal</Button>
                  <Button loading={submitting} onClick={handleNextStep} className="flex-1" disabled={!regForm.business_name || !regForm.phone || !regForm.address || !ktpFile}>
                    Lanjut Pilih Stand →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Pilih Stand */}
            {regStep === 2 && (
              <div className="space-y-4 animate-[slideIn_0.2s_ease]">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Langkah 2: Pilih Stand / Tenant</h3>
                {registerModal.layout_image_url && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Denah Lokasi Stand</label>
                    <div 
                      className="bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 relative group cursor-zoom-in"
                      onClick={() => setFullscreenImage(registerModal.layout_image_url!)}
                    >
                      <img src={registerModal.layout_image_url} alt="Denah Lokasi" className="w-full object-contain max-h-48" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-sm">
                        🔍 Lihat Penuh
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Stand yang Tersedia</label>
                  {stands.length === 0 ? (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-700">
                      Tidak ada pilihan stand khusus untuk event ini, atau stand sudah penuh. Anda tetap bisa mendaftar.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {stands.map(stand => (
                        <div 
                          key={stand.id} 
                          onClick={() => setSelectedStand(stand)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedStand?.id === stand.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800'}`}
                        >
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{stand.name}</div>
                          <div className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-1">Rp {Number(stand.price).toLocaleString('id-ID')}</div>
                          {stand.features && stand.features.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {stand.features.map(f => (
                                <span key={f} className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded capitalize">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setRegStep(1)} className="flex-1">← Kembali</Button>
                  <Button
                    loading={submitting}
                    onClick={handleGoToTerms}
                    className="flex-1"
                    disabled={stands.length > 0 && !selectedStand}
                  >
                    {registerModal.terms_conditions
                      ? 'Lanjut S&K →'
                      : ((selectedStand ? Number(selectedStand.price) : Number(registerModal.price)) > 0 ? `Daftar & Bayar` : 'Kirim Pendaftaran')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Syarat & Ketentuan */}
            {regStep === 3 && registerModal.terms_conditions && (
              <div className="space-y-4 animate-[slideIn_0.2s_ease]">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Langkah 3: Syarat & Ketentuan Penyelenggara</h3>
                
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">⚠️ Harap baca dengan seksama!</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Syarat dan ketentuan berikut ditetapkan oleh penyelenggara event. Kamu wajib menyetujuinya sebelum mendaftar.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-4 max-h-52 overflow-y-auto">
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {registerModal.terms_conditions}
                  </pre>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                      {agreedToTerms && (
                        <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                          <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Saya telah membaca dan <span className="font-semibold text-blue-600 dark:text-blue-400">menyetujui</span> seluruh syarat & ketentuan yang ditetapkan oleh penyelenggara event ini.
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setRegStep(2)} className="flex-1">← Kembali</Button>
                  <Button
                    loading={submitting}
                    onClick={handleRegister}
                    className="flex-1"
                    disabled={!agreedToTerms}
                  >
                    {(selectedStand ? Number(selectedStand.price) : Number(registerModal.price)) > 0 ? `Daftar & Bayar` : 'Kirim Pendaftaran'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>


      {/* Chat Modal (dari Tanya Host) */}
      {chatModal && (
        <ChatModal
          open={!!chatModal}
          onClose={() => setChatModal(null)}
          conversationId={chatModal.convId}
          chatPartnerName={chatModal.partnerName}
          chatPartnerAvatar={chatModal.partnerAvatar}
        />
      )}

      {/* Document Viewer Modal */}
      {docViewer && (
        <SecureDocumentViewer
          open={!!docViewer}
          onClose={() => setDocViewer(null)}
          url={docViewer.url}
          title={docViewer.title}
        />
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.2s_ease]" 
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt="Fullscreen Layout" 
            className="max-w-full max-h-[90vh] object-contain cursor-default rounded-xl" 
            onClick={e => e.stopPropagation()} 
          />
          <button 
            onClick={() => setFullscreenImage(null)} 
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors backdrop-blur-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sponsor Banner di bawah */}
      <div className="pt-8 pb-4">
        <SponsorBanner />
      </div>
    </div>
  )
}
