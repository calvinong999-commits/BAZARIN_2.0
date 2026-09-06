import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Alert, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui'
import type { Category, Event, Stand } from '../../lib/types'

export function EventForm() {
  const navigate = useNavigate()
  const location = useLocation()
  // editEvent dikirim via navigate('/host/events/edit', { state: { event } })
  const editEvent = (location.state as any)?.event as Event | undefined

  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  const [form, setForm] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || '',
    category_id: editEvent?.category_id || '',
    city: editEvent?.city || '',
    location: editEvent?.location || '',
    address: editEvent?.address || '',
    start_date: editEvent?.start_date || '',
    end_date: editEvent?.end_date || '',
    start_time: editEvent?.start_time || '',
    end_time: editEvent?.end_time || '',
    price: String(editEvent?.price || '0'),
    cover_image: editEvent?.cover_image || '',
    tags: (editEvent?.tags || []).join(', '),
    contact_phone: editEvent?.contact_phone || '',
    proposal_url: editEvent?.proposal_url || '',
    izin_url: editEvent?.izin_url || '',
    ktp_url: editEvent?.ktp_url || '',
    layout_image_url: editEvent?.layout_image_url || '',
    terms_conditions: editEvent?.terms_conditions || '',
  })

  const [stands, setStands] = useState<Partial<Stand>[]>([])

  useEffect(() => {
    if (editEvent?.id) {
      supabase.from('event_stands').select('*').eq('event_id', editEvent.id).then(({ data }) => {
        if (data) setStands(data)
      })
    }
  }, [editEvent])

  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [izinFile, setIzinFile] = useState<File | null>(null)
  const [ktpFile, setKtpFile] = useState<File | null>(null)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data || []) as Category[]))
  }, [])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingImg(true)
    const ext = file.name.split('.').pop()
    const path = `events/${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('bzr-media').upload(path, file, { upsert: true })
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('bzr-media').getPublicUrl(path)
      set('cover_image', publicUrl)
    }
    setUploadingImg(false)
  }

  async function handleLayoutUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingImg(true)
    const ext = file.name.split('.').pop()
    const path = `layouts/${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('bzr-media').upload(path, file, { upsert: true })
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('bzr-media').getPublicUrl(path)
      set('layout_image_url', publicUrl)
    }
    setUploadingImg(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.start_date || !form.end_date) {
      setError('Lengkapi field yang wajib diisi.'); return
    }
    if (stands.length < 5) {
      setError('Anda diwajibkan menambahkan minimal 5 stand pada bagian Daftar Stand.'); return
    }
    setLoading(true)

    const payload = {
      host_id: user!.id,
      title: form.title,
      description: form.description || null,
      category_id: form.category_id || null,
      city: form.city || null,
      location: form.location || null,
      address: form.address || null,
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      total_slots: stands.length,
      available_slots: stands.filter(s => s.is_available !== false).length,
      price: parseFloat(form.price) || 0,
      cover_image: form.cover_image || null,
      layout_image_url: form.layout_image_url || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : null,
      contact_phone: form.contact_phone || null,
      terms_conditions: form.terms_conditions || null,
      status: 'pending',
    } as Partial<Event>

    // Upload KTP if new file selected
    if (ktpFile) {
      const ext = ktpFile.name.split('.').pop()
      const path = `ktp-host/${user!.id}/${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('bzr-media').upload(path, ktpFile)
      if (up) {
        const { data: { publicUrl } } = supabase.storage.from('bzr-media').getPublicUrl(path)
        payload.ktp_url = publicUrl
      }
    } else if (form.ktp_url) {
      payload.ktp_url = form.ktp_url
    }

    // Upload Proposal if new file selected
    if (proposalFile) {
      const ext = proposalFile.name.split('.').pop()
      const path = `proposals/${user!.id}/${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('bzr-media').upload(path, proposalFile)
      if (up) {
        const { data: { publicUrl } } = supabase.storage.from('bzr-media').getPublicUrl(path)
        payload.proposal_url = publicUrl
      }
    } else if (form.proposal_url) {
      payload.proposal_url = form.proposal_url
    }

    // Upload Izin if new file selected
    if (izinFile) {
      const ext = izinFile.name.split('.').pop()
      const path = `izin/${user!.id}/${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('bzr-media').upload(path, izinFile)
      if (up) {
        const { data: { publicUrl } } = supabase.storage.from('bzr-media').getPublicUrl(path)
        payload.izin_url = publicUrl
      }
    } else if (form.izin_url) {
      payload.izin_url = form.izin_url
    }

    let err
    let eventId = editEvent?.id
    if (editEvent) {
      const res = await supabase.from('events').update(payload).eq('id', editEvent.id).select().single()
      err = res.error
      if (res.data) eventId = res.data.id
    } else {
      const res = await supabase.from('events').insert(payload).select().single()
      err = res.error
      if (res.data) eventId = res.data.id
    }

    if (!err && eventId && stands.length > 0) {
      const newStands = stands.filter(s => !s.id).map(s => {
        const obj = { ...s, event_id: eventId }
        delete obj.id
        return obj
      })
      const existingStands = stands.filter(s => s.id).map(s => ({
        ...s,
        event_id: eventId
      }))

      if (newStands.length > 0) {
        const res = await supabase.from('event_stands').insert(newStands)
        if (res.error) err = res.error
      }
      if (!err && existingStands.length > 0) {
        const res = await supabase.from('event_stands').upsert(existingStands)
        if (res.error) err = res.error
      }
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => navigate('/host/events'), 1200)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/host/events')} className="text-slate-400 hover:text-blue-600 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editEvent ? 'Edit Event' : 'Buat Event Baru'}</h2>
      </div>

      {success && <Alert type="success" message="Event berhasil disimpan! Menunggu verifikasi admin." />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cover image */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-700">Foto Cover Event</h3>
          <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors">
            {form.cover_image
              ? <img src={form.cover_image} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">📷</span><span className="text-sm">Upload foto event</span></div>}
            <label className="absolute inset-0 cursor-pointer flex items-end justify-center pb-4">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <span className="bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur">
                {uploadingImg ? '⏳ Mengupload...' : '📷 Ganti Foto'}
              </span>
            </label>
          </div>
        </Card>

        {/* Basic info */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Informasi Dasar</h3>
          <Input label="Nama Event *" placeholder="Contoh: Bazaar Ramadan 2026" value={form.title} onChange={e => set('title', e.target.value)} required />
          <Textarea label="Deskripsi" placeholder="Ceritakan tentang event ini..." value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Kategori" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Pilih kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
            <Input label="Harga (Rp)" type="number" placeholder="0 = Gratis" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <Input label="Tags (pisah koma)" placeholder="kuliner, fashion, ..." value={form.tags} onChange={e => set('tags', e.target.value)} />
        </Card>

        {/* Layout & Stands */}
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">🏢 Denah & Stand / Tenant</h3>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700 text-sm">Denah Stand (Gambar)</h4>
            <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors">
              {form.layout_image_url
                ? <img src={form.layout_image_url} alt="layout" className="w-full h-full object-contain" />
                : <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">🗺️</span><span className="text-sm">Upload Denah</span></div>}
              <label className="absolute inset-0 cursor-pointer flex items-end justify-center pb-4">
                <input type="file" accept="image/*" className="hidden" onChange={handleLayoutUpload} />
                <span className="bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur">
                  {uploadingImg ? '⏳ Mengupload...' : '📷 Ganti Denah'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700 text-sm">Daftar Stand</h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setStands([...stands, { name: '', price: parseInt(form.price) || 0, features: [], is_available: true }])}>
                + Tambah Stand
              </Button>
            </div>

            {stands.map((stand, idx) => (
              <div key={idx} className="flex gap-3 items-start border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nama/Nomor Stand *" value={stand.name || ''} onChange={e => {
                      const newStands = [...stands]; newStands[idx].name = e.target.value; setStands(newStands)
                    }} required />
                    <Input label="Harga (Rp) *" type="number" value={stand.price || 0} onChange={e => {
                      const newStands = [...stands]; newStands[idx].price = parseInt(e.target.value) || 0; setStands(newStands)
                    }} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fasilitas</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input type="checkbox" checked={stand.features?.includes('listrik')} onChange={e => {
                        const newStands = [...stands]
                        if (e.target.checked) newStands[idx].features = [...(stand.features || []), 'listrik']
                        else newStands[idx].features = (stand.features || []).filter(f => f !== 'listrik')
                        setStands(newStands)
                      }} className="w-4 h-4 rounded text-blue-600" />
                      Listrik Tersedia
                    </label>
                  </div>
                </div>
                <button type="button" onClick={() => setStands(stands.filter((_, i) => i !== idx))} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">✕</button>
              </div>
            ))}
          </div>
        </Card>

        {/* Location & Contact */}
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">📍 Lokasi & Kontak</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Kota *" value={form.city} onChange={e => set('city', e.target.value)} required />
            <Input label="Nama Tempat *" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mis: JCC Senayan" required />
          </div>
          <Input label="Kontak Telepon *" value={form.contact_phone} onChange={e => {
            let v = e.target.value.replace(/[^0-9]/g, '')
            if (v.startsWith('62')) v = v.substring(2)
            else if (v.startsWith('0')) v = v.substring(1)
            if (v.length > 13) v = v.substring(0, 13)
            set('contact_phone', v ? `+62${v}` : '')
          }} placeholder="+628123456789" required />
          <Textarea label="Informasi Tempat (Lengkap & Spesifik) *" value={form.address} onChange={e => set('address', e.target.value)} rows={2} required />
        </Card>

        {/* Docs */}
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">📋 Dokumen Persyaratan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Proposal Kegiatan (PDF/Word) *</label>
              {form.proposal_url && !proposalFile && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">✓ Proposal sudah diunggah</p>
              )}
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setProposalFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer" required={!form.proposal_url} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Surat Izin Event (PDF/Doc) *</label>
              {form.izin_url && !izinFile && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">✓ Surat Izin sudah diunggah</p>
              )}
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setIzinFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer" required={!form.izin_url} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto KTP Penyelenggara *</label>
              {form.ktp_url && !ktpFile && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">✓ KTP sudah diunggah</p>
              )}
              <input type="file" accept="image/*" onChange={e => setKtpFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer" required={!form.ktp_url} />
            </div>
          </div>
        </Card>

        {/* Date & Time */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Tanggal & Waktu</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tanggal Mulai *" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
            <Input label="Tanggal Selesai *" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Jam Mulai *" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
            <Input label="Jam Selesai *" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} required />
          </div>
        </Card>

        {/* Syarat & Ketentuan */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">📜 Syarat & Ketentuan Peserta</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Opsional — Jika diisi, UMKM wajib membaca dan menyetujuinya sebelum mendaftar. Akan ditampilkan ke peserta saat proses pendaftaran.</p>
          </div>
          <Textarea
            label="Tulis syarat & ketentuan event kamu"
            placeholder={`Contoh:\n1. Peserta wajib hadir tepat waktu\n2. Booth dibuka pukul 08.00 WIB\n3. Dilarang menjual produk di luar kategori yang didaftarkan\n4. ...`}
            value={form.terms_conditions}
            onChange={e => set('terms_conditions', e.target.value)}
            rows={6}
          />
          {form.terms_conditions && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">✅ Syarat & Ketentuan akan ditampilkan ke UMKM saat mendaftar</p>
            </div>
          )}
        </Card>

        {error && <Alert type="error" message={error} />}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/host/events')} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1" size="lg">{editEvent ? 'Simpan Perubahan' : 'Kirim untuk Verifikasi'}</Button>
        </div>
      </form>
    </div>
  )
}
