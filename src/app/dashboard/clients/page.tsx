'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PageHeader } from '@/components/ui'
import type { Client } from '@/types/database'

function EmptyClients() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <User size={28} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No clients yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Add your first client to start creating estimates.</p>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
  const supabase = createClient()

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients((data as Client[]) || [])
    setLoading(false)
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('clients').insert({ ...form })
    setForm({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    loadClients()
  }

  const filtered = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''} total`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowForm(v => !v)}>
            New Client
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={saveClient} className="rounded-xl border p-6 flex flex-col gap-4" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>New Client</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name or company" />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
            <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Client</Button>
          </div>
        </form>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or city..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyClients />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div key={c.id} className="rounded-xl border p-5 flex items-center justify-between hover:shadow-sm transition-shadow" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.email && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Mail size={11} />{c.email}</span>}
                    {c.phone && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Phone size={11} />{c.phone}</span>}
                    {c.city && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><MapPin size={11} />{c.city}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}