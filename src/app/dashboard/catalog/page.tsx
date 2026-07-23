'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PageHeader, EmptyState } from '@/components/ui'
import { Plus, Trash2, Package, ChevronRight } from 'lucide-react'
import type { ServiceType, EstimateTemplate, EstimateTemplateSection, EstimateTemplateItem, SectionType } from '@/types/database'

const SECTION_TYPES: SectionType[] = ['material', 'labor', 'permit', 'other']
const SECTION_LABELS: Record<SectionType, string> = {
  material: 'Materials', labor: 'Labor', permit: 'Permits', other: 'Other',
}
const UNITS_BY_TYPE: Record<SectionType, string[]> = {
  material: ['un', 'ft', 'sf', 'm²', 'lb'],
  labor: ['hr', 'day', 'job'],
  permit: ['un', 'job'],
  other: ['un', 'job'],
}

type SectionWithItems = EstimateTemplateSection & { items: EstimateTemplateItem[] }

export default function CatalogPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionWithItems[]>([])
  // Ref espelha o estado atual — permite saveItem ler o valor mais recente sem closure obsoleta
  const sectionsRef = useRef<SectionWithItems[]>([])
  useEffect(() => { sectionsRef.current = sections }, [sections])
  const [newTypeName, setNewTypeName] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: role } = await supabase.from('user_roles').select('org_id').eq('user_id', user.id).single()
      if (!role) return
      setOrgId(role.org_id)

      const { data: types } = await supabase
        .from('service_types').select('*').eq('org_id', role.org_id).order('sort_order')
      setServiceTypes(types ?? [])
      if (types && types.length > 0) setSelectedId(types[0].id)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedId) { setSections([]); return }
    loadSections(selectedId)
  }, [selectedId])

  async function loadSections(serviceTypeId: string) {
    // Garante que existe um template default pra esse service type
    let { data: template } = await supabase
      .from('estimate_templates').select('*').eq('service_type_id', serviceTypeId).eq('is_default', true).maybeSingle()

    if (!template) {
      const { data: newTemplate } = await supabase
        .from('estimate_templates')
        .insert({ org_id: orgId, service_type_id: serviceTypeId, name: 'Default', is_default: true })
        .select().single()
      template = newTemplate
    }
    if (!template) return

    let { data: secs } = await supabase
      .from('estimate_template_sections').select('*').eq('template_id', template.id).order('sort_order')

    // Garante as 3 seções pré-definidas
    const existingTypes = new Set((secs ?? []).map(s => s.section_type))
    const missing = (['material', 'labor', 'permit'] as SectionType[]).filter(t => !existingTypes.has(t))
    if (missing.length > 0) {
      const inserts = missing.map((type, i) => ({
        template_id: template!.id, name: SECTION_LABELS[type], section_type: type,
        sort_order: (secs?.length ?? 0) + i,
      }))
      await supabase.from('estimate_template_sections').insert(inserts)
      const { data: refreshed } = await supabase
        .from('estimate_template_sections').select('*').eq('template_id', template.id).order('sort_order')
      secs = refreshed
    }

    const sectionIds = (secs ?? []).map(s => s.id)
    const { data: items } = sectionIds.length > 0
      ? await supabase.from('estimate_template_items').select('*').in('template_section_id', sectionIds).order('sort_order')
      : { data: [] }

    const combined: SectionWithItems[] = (secs ?? []).map(s => ({
      ...s,
      items: (items ?? []).filter(i => i.template_section_id === s.id),
    }))
    setSections(combined)
  }

  async function addServiceType() {
    if (!newTypeName.trim() || !orgId) return
    const { data } = await supabase
      .from('service_types')
      .insert({ org_id: orgId, name: newTypeName.trim(), sort_order: serviceTypes.length })
      .select().single()
    if (data) {
      setServiceTypes(t => [...t, data])
      setSelectedId(data.id)
      setNewTypeName('')
    }
  }

  async function removeServiceType(id: string) {
    await supabase.from('service_types').delete().eq('id', id)
    setServiceTypes(t => t.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(serviceTypes.find(s => s.id !== id)?.id ?? null)
  }

  async function addItem(section: SectionWithItems) {
    const { data } = await supabase
      .from('estimate_template_items')
      .insert({
        template_section_id: section.id,
        description: '', unit: UNITS_BY_TYPE[section.section_type][0],
        unit_price: 0, labor_hours: 0, labor_rate: 0,
        item_type: section.section_type, sort_order: section.items.length,
      })
      .select().single()
    if (data) {
      setSections(s => s.map(sec => sec.id === section.id ? { ...sec, items: [...sec.items, data] } : sec))
    }
  }

  async function updateItem(itemId: string, sectionId: string, field: string, value: string) {
    setSections(s => {
      const next = s.map(sec => sec.id !== sectionId ? sec : {
        ...sec,
        items: sec.items.map(i => i.id === itemId ? { ...i, [field]: value } : i),
      })
      sectionsRef.current = next // sync imediato — não depende do timing do useEffect
      return next
    })
  }

  async function saveItem(itemId: string, sectionId: string) {
    const sec = sectionsRef.current.find(s => s.id === sectionId)
    const item = sec?.items.find(i => i.id === itemId)
    if (!item) return
    const { error } = await supabase.from('estimate_template_items').update({
      description: item.description,
      unit: item.unit,
      unit_price: Number(item.unit_price) || 0,
      labor_hours: Number(item.labor_hours) || 0,
      labor_rate: Number(item.labor_rate) || 0,
    }).eq('id', item.id)
    if (error) console.error('Erro ao salvar item do catálogo:', error.message)
  }

  async function removeItem(itemId: string, sectionId: string) {
    await supabase.from('estimate_template_items').delete().eq('id', itemId)
    setSections(s => s.map(sec => sec.id !== sectionId ? sec : { ...sec, items: sec.items.filter(i => i.id !== itemId) }))
  }

  if (loading) return null

  const selectedType = serviceTypes.find(t => t.id === selectedId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Item Catalog"
        subtitle="Cadastre os produtos e serviços que aparecerão como checklist ao criar um orçamento"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 md:px-8">
        {/* Service Types list */}
        <div className="lg:col-span-1 surface-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Service Types
          </p>
          <div className="flex flex-col gap-1">
            {serviceTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors"
                style={{
                  background: selectedId === t.id ? 'var(--brand-50)' : 'transparent',
                  color: selectedId === t.id ? 'var(--brand-600)' : 'var(--text-primary)',
                  fontWeight: selectedId === t.id ? 600 : 400,
                }}
              >
                <span>{t.name}</span>
                {selectedId === t.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 text-sm px-2 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
              placeholder="New service type…"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addServiceType()}
            />
            <Button size="sm" icon={<Plus size={13} />} onClick={addServiceType}>Add</Button>
          </div>
        </div>

        {/* Sections + items for selected service type */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {!selectedType ? (
            <EmptyState
              icon={<Package size={28} />}
              title="No service types yet"
              description="Create a service type (e.g. Electrical, Plumbing) to start building its item catalog."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedType.name}
                </p>
                <button
                  onClick={() => removeServiceType(selectedType.id)}
                  className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Trash2 size={12} /> Remove service type
                </button>
              </div>

              {sections.map(section => (
                <div key={section.id} className="surface-card overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {section.name}
                    </span>
                    <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addItem(section)}>
                      Add item
                    </Button>
                  </div>
                  {section.items.length === 0 ? (
                    <p className="text-xs px-4 py-4" style={{ color: 'var(--text-tertiary)' }}>
                      No items yet — click &quot;Add item&quot; to start building this list.
                    </p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {section.items.map(item => (
                        <div key={item.id} className="px-4 py-2 flex items-center gap-2">
                          <textarea
                            className="flex-1 text-sm bg-transparent outline-none resize-none leading-snug py-1"
                            placeholder="Description"
                            value={item.description}
                            onChange={e => updateItem(item.id, section.id, 'description', e.target.value)}
                            onBlur={() => saveItem(item.id, section.id)}
                            title={item.description}
                            rows={2}
                          />
                          <select
                            className="text-xs w-16 bg-transparent outline-none"
                            value={item.unit ?? ''}
                            onChange={e => { updateItem(item.id, section.id, 'unit', e.target.value); }}
                            onBlur={() => saveItem(item.id, section.id)}
                          >
                            {UNITS_BY_TYPE[section.section_type].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          {section.section_type === 'labor' ? (
                            <>
                              <input
                                className="w-16 text-sm text-right bg-transparent outline-none font-mono"
                                type="number" placeholder="hrs"
                                value={item.labor_hours}
                                onChange={e => updateItem(item.id, section.id, 'labor_hours', e.target.value)}
                                onBlur={() => saveItem(item.id, section.id)}
                              />
                              <input
                                className="w-20 text-sm text-right bg-transparent outline-none font-mono"
                                type="number" placeholder="rate"
                                value={item.labor_rate}
                                onChange={e => updateItem(item.id, section.id, 'labor_rate', e.target.value)}
                                onBlur={() => saveItem(item.id, section.id)}
                              />
                            </>
                          ) : (
                            <input
                              className="w-20 text-sm text-right bg-transparent outline-none font-mono"
                              type="number" placeholder="price"
                              value={item.unit_price}
                              onChange={e => updateItem(item.id, section.id, 'unit_price', e.target.value)}
                              onBlur={() => saveItem(item.id, section.id)}
                            />
                          )}
                          <button
                            onClick={() => removeItem(item.id, section.id)}
                            className="p-1 rounded hover:bg-red-50"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
