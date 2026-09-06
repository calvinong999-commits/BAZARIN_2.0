import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Alert, Avatar, Button, Card, Input, Spinner, Textarea } from '../../components/ui'
import { UmkmReviewsList } from '../../components/UmkmReviewsList'

export function UMKMProfile() {
  const { user, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const p = user?.profile

  const [form, setForm] = useState({
    full_name: p?.full_name || '',
    business_name: p?.business_name || '',
    phone: p?.phone || '',
    city: p?.city || '',
    bio: p?.bio || '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', user!.id)
    if (err) { setError(err.message); setSaving(false); return }
    await refreshProfile()
    setSaving(false); setEditing(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!user) return <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Profil Saya</h2>

      {success && <Alert type="success" message="Profil berhasil diperbarui!" />}

      <Card className="p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar name={p?.full_name} url={p?.avatar_url} size={64} />
          <div>
            <p className="font-bold text-slate-800 text-lg">{p?.full_name || 'Pengguna'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">UMKM</p>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-3">
            {[
              { l: 'Nama Lengkap', v: p?.full_name },
              { l: 'Nama Usaha', v: p?.business_name },
              { l: 'Nomor Telepon', v: p?.phone },
              { l: 'Kota', v: p?.city },
              { l: 'Bio', v: p?.bio },
            ].map(row => (
              <div key={row.l} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 text-sm w-32 shrink-0">{row.l}</span>
                <span className="text-slate-800 text-sm font-medium">{row.v || '—'}</span>
              </div>
            ))}
            <Button onClick={() => setEditing(true)} variant="outline" className="w-full mt-2">Edit Profil</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input label="Nama Lengkap *" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            <Input label="Nama Usaha (Opsional)" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
            <Input label="Nomor Telepon *" type="tel" value={form.phone} onChange={e => {
              let v = e.target.value.replace(/[^0-9]/g, '')
              if (v.startsWith('62')) v = v.substring(2)
              else if (v.startsWith('0')) v = v.substring(1)
              if (v.length > 13) v = v.substring(0, 13)
              set('phone', v ? `+62${v}` : '')
            }} placeholder="+628123456789" required />
            <Input label="Kota *" value={form.city} onChange={e => set('city', e.target.value)} required />
            <Textarea label="Bio (Opsional)" value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} />
            {error && <Alert type="error" message={error} />}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setEditing(false)} className="flex-1">Batal</Button>
              <Button loading={saving} onClick={handleSave} className="flex-1">Simpan</Button>
            </div>
          </div>
        )}
      </Card>

      <UmkmReviewsList umkmId={user.id} />
    </div>
  )
}
