'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PageHeader } from '@/components/ui'
import type { Client } from '@/types/database'
import { useT } from '@/lib/i18n'

function EmptyClients() {
  const { t } = useT()
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <User size={28} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{t('clients.emptyTitle')}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('clients.emptyDesc')}</p>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const { t } = useT()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
  const supabase = createClient()

  useEffect(() => { loadClients() }, [])

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: role } = await supabase.from('user_roles').select('org_id').eq('user_id', user.id).single()
    return role?.org_id ?? null
  }

  async function loadClients() {
    setLoading(true)
    const orgId = await getOrgId()
    const { data } = await supabase.from('clients').select('*').eq('org_id', orgId).order('name')
    setClients((data as Client[]) || [])
    setLoading(false)
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const orgId = await getOrgId()
    await supabase.from('clients').insert({ ...form, org_id: orgId })
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
        title={t('clients.title')}
        subtitle={`${clients.length} ${clients.length !== 1 ? t('clients.plural') : t('clients.singular')}`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowForm(v => !v)}>
            {t('clients.newClient')}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={saveClient} className="rounded-xl border p-6 flex flex-col gap-4" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('clients.newClient')}</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('clients.name')} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('clients.namePlaceholder')} />
            <Input label={t('clients.email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('clients.emailPlaceholder')} />
            <Input label={t('clients.phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={t('clients.phonePlaceholder')} />
            <Input label={t('clients.city')} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder={t('clients.cityPlaceholder')} />
            <Input label={t('clients.address')} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t('clients.addressPlaceholder')} className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>{t('clients.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('clients.save')}</Button>
          </div>
        </form>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('clients.searchPlaceholder')}
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