import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Alert, Button, Card, Empty, Input, Modal, Spinner } from '../../components/ui'
import type { Category } from '../../lib/types'

export function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCats((data || []) as Category[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditCat(null); setForm({ name: '', slug: '', icon: '' }); setModal(true) }
  function openEdit(c: Category) { setEditCat(c); setForm({ name: c.name, slug: c.slug, icon: c.icon || '' }); setModal(true) }

  async function handleSave() {
    setSaving(true); setError('')
    const payload = { name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'), icon: form.icon || null }
    const { error: err } = editCat
      ? await supabase.from('categories').update(payload).eq('id', editCat.id)
      : await supabase.from('categories').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    setModal(false); setSaving(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('categories').delete().eq('id', deleteId)
    setDeleteId(null); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Manajemen Kategori</h2>
        <Button size="sm" onClick={openCreate}>+ Tambah Kategori</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} className="text-blue-600" /></div>
      ) : cats.length === 0 ? (
        <Card className="p-12"><Empty icon="🏷️" title="Belum ada kategori" action={<Button size="sm" onClick={openCreate}>+ Tambah</Button>} /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map(c => (
            <Card key={c.id} className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{c.icon || '🏷️'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400 font-mono">{c.slug}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm">✏️</button>
                <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors text-sm">🗑</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editCat ? 'Edit Kategori' : 'Tambah Kategori'}>
        <div className="space-y-4">
          <Input label="Nama Kategori" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bazaar, Festival, ..." required />
          <Input label="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="bazaar (auto-generate)" />
          <Input label="Icon Emoji" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎪" />
          {error && <Alert type="error" message={error} />}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1">Batal</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Kategori">
        <p className="text-slate-600 mb-5">Yakin ingin menghapus kategori ini?</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1">Batal</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Hapus</Button>
        </div>
      </Modal>
    </div>
  )
}
