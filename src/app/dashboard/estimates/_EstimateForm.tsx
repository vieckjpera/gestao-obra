'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, ChevronDown, ChevronUp, DollarSign,
  User, Layers, CheckCircle2, Circle, AlertCircle,
  FileDown, Save, ArrowLeft, GripVertical
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select, Badge, PageHeader } from '@/components/ui'
import type { Client, ServiceType, EstimateTemplateItem, EstimateTemplateSection, ItemType, SectionType, EstimateSection, EstimateItem } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────
interface DraftItem {
  id: string
  description: string
  vendor_notes: string
  qty: string
  unit: string
  unit_price: string
  labor_hours: string
  labor_rate: string
  item_type: ItemType
}

interface DraftSection {
  id: string
  name: string
  section_type: SectionType
  locked: boolean // seções pré-definidas não podem ser removidas nem renomeadas
  catalogSectionId?: string // vincula à seção exata do catálogo (evita ambiguidade quando há várias seções do mesmo tipo)
  items: DraftItem[]
}

const MATERIAL_UNITS = ['un', 'ft', 'sf', 'm²', 'lb']
const LABOR_UNITS = ['hr', 'day', 'job']
const OTHER_UNITS = [...MATERIAL_UNITS, ...LABOR_UNITS]

function unitsForType(type: SectionType): string[] {
  if (type === 'labor') return LABOR_UNITS
  if (type === 'material' || type === 'permit') return MATERIAL_UNITS
  return OTHER_UNITS
}

const SECTION_LABELS: Record<SectionType, string> = {
  material: 'Materials', labor: 'Labor', permit: 'Permits', other: 'Other',
}

function newItem(sectionType: SectionType): DraftItem {
  return {
    id: crypto.randomUUID(),
    description: '', vendor_notes: '', qty: '',
    unit: unitsForType(sectionType)[0], unit_price: '', labor_hours: '0',
    labor_rate: '0', item_type: sectionType, // herda direto — nunca hardcoded 'material'
  }
}

function newSection(type: SectionType, locked = false): DraftSection {
  return { id: crypto.randomUUID(), name: SECTION_LABELS[type], section_type: type, locked, items: [] }
}

// ── Calculations ──────────────────────────────────────────────
function calcLineTotal(item: DraftItem): number {
  const qty = parseFloat(item.qty) || 0
  const price = parseFloat(item.unit_price) || 0
  const hrs = parseFloat(item.labor_hours) || 0
  const rate = parseFloat(item.labor_rate) || 0
  return qty * price + hrs * rate
}

// Um item "conta" pro orçamento só se o usuário de fato informou uso —
// não basta ter descrição, porque itens vindos do catálogo já chegam com
// descrição preenchida (são referência, não uso automático).
function isItemUsed(item: DraftItem): boolean {
  return item.item_type === 'labor'
    ? parseFloat(item.labor_hours) > 0
    : parseFloat(item.qty) > 0
}

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ── Checklist ────────────────────────────────────────────────
function useChecklist(
  clientId: string,
  scope: string,
  sections: DraftSection[],
  marginPct: string
) {
  const clientOk  = clientId !== ''
  const sectionsOk = sections.length > 0 && sections.some(s => s.items.some(isItemUsed))
  const itemsOk   = sections.every(s =>
    s.items.filter(isItemUsed).every(i =>
      i.item_type === 'labor'
        ? parseFloat(i.labor_hours) > 0 && parseFloat(i.labor_rate) >= 0
        : parseFloat(i.qty) > 0 && parseFloat(i.unit_price) >= 0
    )
  ) && sectionsOk
  const marginOk  = parseFloat(marginPct) > 0
  const noZeros   = sections.every(s =>
    s.items.filter(isItemUsed).every(i => calcLineTotal(i) > 0)
  ) && sectionsOk

  const checks = [
    { key: 'client',   label: 'Client data complete',              ok: clientOk },
    { key: 'sections', label: 'At least one section with items',   ok: sectionsOk },
    { key: 'items',    label: 'All items have qty and price',       ok: itemsOk },
    { key: 'margin',   label: 'Profit margin defined',             ok: marginOk },
    { key: 'zeros',    label: 'No items with $0 total',            ok: noZeros },
  ]
  const allOk = checks.every(c => c.ok)
  return { checks, allOk }
}

// ── Main Component ────────────────────────────────────────────
export function EstimateForm({ estimateId }: { estimateId?: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [saving, setSaving] = useState(false)

  // Form state
  const [clientId, setClientId]         = useState('')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [scope, setScope]               = useState('')
  const [marginPct, setMarginPct]       = useState('40')
  const [validUntil, setValidUntil]     = useState('')
  const [sections, setSections]         = useState<DraftSection[]>([
    newSection('material', true),
    newSection('labor', true),
    newSection('permit', true),
  ])
  const [taxPct, setTaxPct]             = useState('7.5')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const { checks, allOk } = useChecklist(clientId, scope, sections, marginPct)

  // Totals
  const allItems = sections.flatMap(s => s.items)
  const subtotalMaterials = allItems.filter(i => i.item_type === 'material').reduce((s, i) => s + calcLineTotal(i), 0)
  const subtotalLabor     = allItems.filter(i => i.item_type === 'labor').reduce((s, i) => s + calcLineTotal(i), 0)
  const subtotalOther     = allItems.filter(i => i.item_type !== 'material' && i.item_type !== 'labor').reduce((s, i) => s + calcLineTotal(i), 0)
  const taxAmount         = subtotalMaterials * (parseFloat(taxPct || '0') / 100)
  const grandTotal        = subtotalMaterials + taxAmount + subtotalLabor + subtotalOther
  const totalWithMargin   = grandTotal * (1 + parseFloat(marginPct || '0') / 100)

  useEffect(() => {
    async function load() {
      const [{ data: cls }, { data: sts }] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('service_types').select('*').order('sort_order'),
      ])
      setClients((cls as Client[]) || [])
      const types = (sts as ServiceType[]) || []
      setServiceTypes(types)
      // Auto-selecionar quando só existe um tipo de serviço — evita o usuário
      // não perceber que precisa escolher pra desbloquear o catálogo
      if (!estimateId && types.length === 1) {
        setServiceTypeId(types[0].id)
      }
    }
    load()
  }, [estimateId])

  // Modo edição: carregar estimate existente e popular o formulário
  const [loadingExisting, setLoadingExisting] = useState(!!estimateId)
  useEffect(() => {
    if (!estimateId) return
    async function loadExisting() {
      const { data: est } = await supabase
        .from('estimates')
        .select('*, sections:estimate_sections(*, items:estimate_items(*))')
        .eq('id', estimateId)
        .single()
      if (!est) { setLoadingExisting(false); return }

      setClientId(est.client_id || '')
      setServiceTypeId(est.service_type_id || '')
      setScope(est.scope || '')
      setMarginPct(String(est.profit_margin_pct ?? '40'))
      setTaxPct(String(est.tax_pct ?? '7.5'))
      setValidUntil(est.valid_until ? String(est.valid_until).slice(0, 10) : '')

      const PREDEFINED: SectionType[] = ['material', 'labor', 'permit']
      const loadedSections: DraftSection[] = (est.sections || [])
        .sort((a: EstimateSection, b: EstimateSection) => a.sort_order - b.sort_order)
        .map((s: EstimateSection & { items: EstimateItem[] }) => ({
          id: crypto.randomUUID(),
          name: s.name,
          section_type: s.section_type,
          locked: PREDEFINED.includes(s.section_type),
          items: (s.items || [])
            .sort((a: EstimateItem, b: EstimateItem) => a.sort_order - b.sort_order)
            .map((i: EstimateItem): DraftItem => ({
              id: crypto.randomUUID(),
              description: i.description,
              vendor_notes: i.vendor_notes || '',
              qty: String(i.qty),
              unit: i.unit || unitsForType(s.section_type)[0],
              unit_price: String(i.unit_price),
              labor_hours: String(i.labor_hours),
              labor_rate: String(i.labor_rate),
              item_type: i.item_type,
            })),
        }))

      // Garantir que as 3 seções pré-definidas sempre existam, mesmo se o registro antigo não tiver todas
      for (const type of PREDEFINED) {
        if (!loadedSections.some(s => s.section_type === type)) {
          loadedSections.push(newSection(type, true))
        }
      }
      loadedSections.sort((a, b) => {
        const order: SectionType[] = ['material', 'labor', 'permit', 'other']
        return order.indexOf(a.section_type) - order.indexOf(b.section_type)
      })

      setSections(loadedSections)
      setLoadingExisting(false)
    }
    loadExisting()
  }, [estimateId])

  // Load catalog (reference) — e, se for um orçamento novo/vazio, substitui as 3 seções
  // genéricas pelas seções REAIS do catálogo (nomes e itens idênticos à planilha)
  const [catalogSections, setCatalogSections] = useState<
    (EstimateTemplateSection & { items: EstimateTemplateItem[] })[]
  >([])
  useEffect(() => {
    if (!serviceTypeId) { setCatalogSections([]); return }
    async function loadCatalog() {
      const { data: tpl } = await supabase
        .from('estimate_templates')
        .select('*, sections:estimate_template_sections(*, items:estimate_template_items(*))')
        .eq('service_type_id', serviceTypeId)
        .eq('is_default', true)
        .maybeSingle()
      if (!tpl) { setCatalogSections([]); return }
      const sorted = ((tpl.sections || []) as (EstimateTemplateSection & { items: EstimateTemplateItem[] })[])
        .sort((a, b) => a.sort_order - b.sort_order)
      setCatalogSections(sorted)

      // Só substitui automaticamente se: orçamento novo (não edição) e nada foi preenchido ainda
      // "Vazio" = nenhum item tem descrição digitada ou quantidade real —
      // linhas em branco criadas via "Add item" não devem travar a troca de catálogo
      const isEmpty = sections.every(s =>
        s.items.every(i => !i.description.trim() && !(parseFloat(i.qty) > 0))
      )
      if (sorted.length > 0 && !estimateId && isEmpty) {
        setSections(sorted.map(cs => ({
          id: crypto.randomUUID(),
          name: cs.name,
          section_type: cs.section_type,
          locked: true,
          catalogSectionId: cs.id,
          // Traz TODOS os itens do catálogo já como linhas — igual à planilha —
          // só falta preencher quantidade (e ajustar preço se precisar)
          items: cs.items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((tpl): DraftItem => ({
              id: crypto.randomUUID(),
              description: tpl.description,
              vendor_notes: tpl.vendor_notes || '',
              qty: '',
              unit: tpl.unit || unitsForType(cs.section_type)[0],
              unit_price: String(tpl.unit_price ?? 0),
              labor_hours: String(tpl.labor_hours ?? 0),
              labor_rate: String(tpl.labor_rate ?? 0),
              item_type: cs.section_type,
            })),
        })))
      }
    }
    loadCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTypeId])

  // Section helpers
  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addOtherSection = () => setSections(s => [...s, { ...newSection('other', false), name: 'Other' }])
  const removeSection = (id: string) =>
    setSections(s => s.filter(sec => sec.id !== id || sec.locked))
  const updateSectionName = (id: string, name: string) =>
    setSections(s => s.map(sec => sec.id === id && !sec.locked ? { ...sec, name } : sec))

  const addItem = (sectionId: string) =>
    setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, items: [...sec.items, newItem(sec.section_type)] } : sec))

  // Catalog picker — checklist de itens do catálogo, com quantidade, por seção
  const [openPickerSection, setOpenPickerSection] = useState<string | null>(null)
  const [pickerChecked, setPickerChecked] = useState<Record<string, string>>({}) // itemId -> qty

  function togglePicker(sectionId: string) {
    setOpenPickerSection(prev => prev === sectionId ? null : sectionId)
    setPickerChecked({})
  }

  function addFromCatalog(section: DraftSection) {
    const catalogSection = section.catalogSectionId
      ? catalogSections.find(cs => cs.id === section.catalogSectionId)
      : catalogSections.find(cs => cs.section_type === section.section_type)
    if (!catalogSection) return
    const picked = Object.entries(pickerChecked).filter(([, qty]) => parseFloat(qty) > 0)
    if (picked.length === 0) return

    const newItems: DraftItem[] = picked.map(([itemId, qty]) => {
      const tpl = catalogSection.items.find(i => i.id === itemId)!
      return {
        id: crypto.randomUUID(),
        description: tpl.description,
        vendor_notes: tpl.vendor_notes || '',
        qty,
        unit: tpl.unit || unitsForType(section.section_type)[0],
        unit_price: String(tpl.unit_price),
        labor_hours: String(tpl.labor_hours),
        labor_rate: String(tpl.labor_rate),
        item_type: section.section_type,
      }
    })
    setSections(s => s.map(sec => sec.id === section.id ? { ...sec, items: [...sec.items, ...newItems] } : sec))
    setOpenPickerSection(null)
    setPickerChecked({})
  }
  const removeItem = (sectionId: string, itemId: string) =>
    setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, items: sec.items.filter(i => i.id !== itemId) } : sec))
  const updateItem = (sectionId: string, itemId: string, field: keyof DraftItem, value: string) =>
    setSections(s => s.map(sec =>
      sec.id === sectionId
        ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : sec
    ))

  // Save
  async function handleSave(asPDF = false) {
    if (!allOk) return
    setSaving(true)
    try {
      // Get org_id from user's role
      const { data: { user } } = await supabase.auth.getUser()
      const { data: role } = await supabase
        .from('user_roles').select('org_id').eq('user_id', user?.id).single()

      const orgId = role?.org_id
      if (!orgId) throw new Error('No organization found')

      let est
      if (estimateId) {
        // Modo edição: atualizar o estimate existente e recriar sections+items
        const { data: updated, error: updErr } = await supabase.from('estimates').update({
          client_id: clientId,
          service_type_id: serviceTypeId || null,
          scope: scope || null,
          profit_margin_pct: parseFloat(marginPct),
          tax_pct: parseFloat(taxPct || '0'),
          valid_until: validUntil || null,
        }).eq('id', estimateId).select().single()
        if (updErr || !updated) throw updErr
        est = updated
        // Apagar seções antigas (cascade remove os items) para recriar do zero — mais simples e seguro que diff
        await supabase.from('estimate_sections').delete().eq('estimate_id', estimateId)
      } else {
        // Create estimate
        const { data: created, error: estErr } = await supabase.from('estimates').insert({
          org_id: orgId,
          client_id: clientId,
          service_type_id: serviceTypeId || null,
          scope: scope || null,
          profit_margin_pct: parseFloat(marginPct),
          tax_pct: parseFloat(taxPct || '0'),
          valid_until: validUntil || null,
          check_client_complete: true,
          check_margin_defined: true,
        }).select().single()
        if (estErr || !created) throw estErr
        est = created
      }

      // Create sections + items — seções sem itens preenchidos não são salvas (B2)
      for (let si = 0; si < sections.length; si++) {
        const section = sections[si]
        const filledItems = section.items.filter(isItemUsed)
        if (filledItems.length === 0) continue

        const { data: sec, error: secErr } = await supabase.from('estimate_sections').insert({
          estimate_id: est.id, org_id: orgId,
          name: section.name, section_type: section.section_type, sort_order: si,
        }).select().single()
        if (secErr || !sec) throw secErr

        const itemsPayload = filledItems.map((item: DraftItem, ii: number) => ({
          estimate_id: est.id, section_id: sec.id, org_id: orgId,
          description: item.description,
          vendor_notes: item.vendor_notes || null,
          qty: parseFloat(item.qty) || 0,
          unit: item.unit || null,
          unit_price: parseFloat(item.unit_price) || 0,
          labor_hours: parseFloat(item.labor_hours) || 0,
          labor_rate: parseFloat(item.labor_rate) || 0,
          item_type: item.item_type,
          sort_order: ii,
        }))
        await supabase.from('estimate_items').insert(itemsPayload)
      }

      router.push(`/dashboard/estimates/${est.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'Select client…' },
    ...clients.map(c => ({ value: c.id, label: c.name }))
  ]

  const serviceTypeOptions = [
    { value: '', label: 'Select type (optional)…' },
    ...serviceTypes.filter(st => !st.parent_id).map(st => ({ value: st.id, label: st.name })),
  ]

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-50)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading estimate…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-50)' }}>
      <PageHeader
        title={estimateId ? 'Edit Estimate' : 'New Estimate'}
        subtitle="Fill in all sections before generating the PDF"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => router.back()}>
              Back
            </Button>
            <Button
              variant="secondary" size="sm"
              icon={<Save size={14} />}
              onClick={() => handleSave(false)}
              loading={saving}
              disabled={!allOk}
            >
              Save Draft
            </Button>
            <Button
              size="sm"
              icon={<FileDown size={14} />}
              onClick={() => handleSave(true)}
              loading={saving}
              disabled={!allOk}
            >
              Save & Generate PDF
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Client & Info */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={15} style={{ color: 'var(--brand-500)' }} />
              <h2 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                Client & Project Info
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Client" required
                value={clientId} onChange={e => setClientId(e.target.value)}
                options={clientOptions}
              />
              <Select
                label="Service Type"
                value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)}
                options={serviceTypeOptions}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Scope / Project Description"
                placeholder="e.g. Full electrical remodel — kitchen & 2 baths"
                value={scope} onChange={e => setScope(e.target.value)}
              />
              <Input
                label="Valid Until"
                type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Sections */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={15} style={{ color: 'var(--brand-500)' }} />
                <h2 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                  Sections & Items
                </h2>
              </div>
              <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={addOtherSection}>
                Add Other Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((section, si) => {
                const collapsed = collapsedSections.has(section.id)
                const sectionTotal = section.items.reduce((s, i) => s + calcLineTotal(i), 0)
                const matchedCatalogSection = section.catalogSectionId
                  ? catalogSections.find(cs => cs.id === section.catalogSectionId)
                  : catalogSections.find(cs => cs.section_type === section.section_type)
                return (
                  <div
                    key={section.id}
                    className="border rounded-lg overflow-hidden"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {/* Section Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ background: 'var(--surface-50)' }}
                    >
                      <GripVertical size={14} style={{ color: 'var(--text-tertiary)' }} className="cursor-grab" />
                      <input
                        className="flex-1 text-sm font-medium bg-transparent border-none outline-none disabled:cursor-default"
                        style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                        value={section.name}
                        disabled={section.locked}
                        onChange={e => updateSectionName(section.id, e.target.value)}
                        placeholder="Section name…"
                      />
                      <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {formatUSD(sectionTotal)}
                      </span>
                      {!section.locked && (
                        <button
                          onClick={() => removeSection(section.id)}
                          className="p-1 rounded hover:bg-red-50 transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-1 rounded hover:bg-surface-100 transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>

                    {/* Items */}
                    {!collapsed && (
                      <div className="overflow-x-auto">
                        <div className="min-w-[720px]">
                        {/* Header row */}
                        <div
                          className="grid text-xs px-4 py-2 font-medium"
                          style={{
                            gridTemplateColumns: '1fr 80px 80px 90px 80px 90px 100px 36px',
                            color: 'var(--text-tertiary)',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <span>Description</span>
                          <span>Qty</span>
                          <span>Unit</span>
                          <span>Unit $</span>
                          <span>Labor hrs</span>
                          <span>Labor rate</span>
                          <span className="text-right">Total</span>
                          <span />
                        </div>

                        {section.items.map(item => (
                          <div
                            key={item.id}
                            className="grid items-center px-4 py-2 gap-2 group hover:bg-surface-50 transition-colors"
                            style={{
                              gridTemplateColumns: '1fr 80px 80px 90px 80px 90px 100px 36px',
                              borderBottom: '1px solid var(--border-subtle)',
                            }}
                          >
                            <input
                              className="text-sm bg-transparent border-none outline-none w-full"
                              style={{ color: 'var(--text-primary)' }}
                              value={item.description}
                              onChange={e => updateItem(section.id, item.id, 'description', e.target.value)}
                              placeholder="Item description…"
                            />
                            <input
                              className="text-sm bg-transparent border-none outline-none w-full font-mono text-right"
                              style={{ color: 'var(--text-primary)' }}
                              type="number" min="0" step="any"
                              value={item.qty}
                              onChange={e => updateItem(section.id, item.id, 'qty', e.target.value)}
                              placeholder="0"
                            />
                            <select
                              className="text-xs bg-transparent border-none outline-none cursor-pointer"
                              style={{ color: 'var(--text-secondary)' }}
                              value={item.unit}
                              onChange={e => updateItem(section.id, item.id, 'unit', e.target.value)}
                            >
                              {unitsForType(section.section_type).map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                            <input
                              className="text-sm bg-transparent border-none outline-none w-full font-mono text-right disabled:cursor-not-allowed"
                              style={{ color: section.section_type === 'labor' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                              type="number" min="0" step="0.01"
                              value={item.unit_price}
                              disabled={section.section_type === 'labor'}
                              onChange={e => updateItem(section.id, item.id, 'unit_price', e.target.value)}
                              placeholder="0.00"
                            />
                            <input
                              className="text-sm bg-transparent border-none outline-none w-full font-mono text-right disabled:cursor-not-allowed"
                              style={{ color: section.section_type === 'labor' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                              type="number" min="0" step="0.5"
                              value={item.labor_hours}
                              disabled={section.section_type !== 'labor'}
                              onChange={e => updateItem(section.id, item.id, 'labor_hours', e.target.value)}
                              placeholder="0"
                            />
                            <input
                              className="text-sm bg-transparent border-none outline-none w-full font-mono text-right disabled:cursor-not-allowed"
                              style={{ color: section.section_type === 'labor' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                              type="number" min="0" step="0.01"
                              value={item.labor_rate}
                              disabled={section.section_type !== 'labor'}
                              onChange={e => updateItem(section.id, item.id, 'labor_rate', e.target.value)}
                              placeholder="0.00"
                            />
                            <p className="text-sm font-mono font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                              {formatUSD(calcLineTotal(item))}
                            </p>
                            <button
                              onClick={() => removeItem(section.id, item.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        </div>

                        <div className="px-4 py-2.5 flex items-center gap-2">
                          <Button
                            variant="ghost" size="sm"
                            icon={<Plus size={12} />}
                            onClick={() => addItem(section.id)}
                            className="text-xs"
                          >
                            Add item
                          </Button>
                          {matchedCatalogSection && matchedCatalogSection.items.length > 0 && !section.catalogSectionId && (
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => togglePicker(section.id)}
                              className="text-xs"
                            >
                              Browse Catalog
                            </Button>
                          )}
                          {!serviceTypeId && serviceTypes.length > 1 && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Select a Service Type above to browse the catalog
                            </span>
                          )}
                        </div>

                        {openPickerSection === section.id && (() => {
                          const catalogSection = matchedCatalogSection
                          if (!catalogSection) return null
                          return (
                            <div className="mx-4 mb-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}>
                              <div className="px-3 py-2 border-b text-xs font-medium" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                                Select items from catalog and set quantity
                              </div>
                              <div className="max-h-60 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                                {catalogSection.items.map(tplItem => (
                                  <label key={tplItem.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-black/[0.02]">
                                    <input
                                      type="checkbox"
                                      checked={tplItem.id in pickerChecked}
                                      onChange={e => setPickerChecked(p => {
                                        const next = { ...p }
                                        if (e.target.checked) next[tplItem.id] = '1'
                                        else delete next[tplItem.id]
                                        return next
                                      })}
                                    />
                                    <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                      {tplItem.description}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                      {section.section_type === 'labor'
                                        ? `${tplItem.labor_rate}/${tplItem.unit}`
                                        : `$${tplItem.unit_price}/${tplItem.unit}`}
                                    </span>
                                    <input
                                      type="number" min="0" step="0.5"
                                      className="w-16 text-sm text-right font-mono px-1 py-0.5 rounded border"
                                      style={{ borderColor: 'var(--border-subtle)' }}
                                      value={pickerChecked[tplItem.id] ?? ''}
                                      disabled={!(tplItem.id in pickerChecked)}
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => setPickerChecked(p => ({ ...p, [tplItem.id]: e.target.value }))}
                                    />
                                  </label>
                                ))}
                              </div>
                              <div className="px-3 py-2 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
                                <Button size="sm" onClick={() => addFromCatalog(section)}>
                                  Add Selected
                                </Button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Summary + Checklist */}
        <div className="space-y-4">

          {/* Margin */}
          <div className="surface-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={15} style={{ color: 'var(--brand-500)' }} />
              <h2 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                Margin & Totals
              </h2>
            </div>
            <Input
              label="Profit Margin %"
              type="number" min="0" max="100" step="1"
              value={marginPct}
              onChange={e => setMarginPct(e.target.value)}
              suffix={<span className="text-xs">%</span>}
            />
            <div className="mt-3">
              <Input
                label="Materials Tax %"
                type="number" min="0" max="100" step="0.1"
                value={taxPct}
                onChange={e => setTaxPct(e.target.value)}
                suffix={<span className="text-xs">%</span>}
              />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'Materials',                          value: subtotalMaterials },
                { label: `Materials Tax (${taxPct || 0}%)`,     value: taxAmount },
                { label: 'Labor',                               value: subtotalLabor },
                { label: 'Other',                               value: subtotalOther },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatUSD(value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Grand Total</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatUSD(grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span style={{ color: 'var(--brand-500)', fontWeight: 600 }}>
                    Total with {marginPct}% margin
                  </span>
                  <span
                    className="font-mono font-bold text-base"
                    style={{ color: 'var(--brand-500)' }}
                  >
                    {formatUSD(totalWithMargin)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                Checklist
              </h2>
              {allOk
                ? <Badge variant="success">Ready</Badge>
                : <Badge variant="draft">{checks.filter(c => !c.ok).length} pending</Badge>
              }
            </div>
            <div className="space-y-2.5">
              {checks.map(check => (
                <div key={check.key} className="flex items-center gap-2.5">
                  {check.ok
                    ? <CheckCircle2 size={16} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
                    : <AlertCircle  size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  }
                  <span
                    className="text-sm"
                    style={{ color: check.ok ? 'var(--text-secondary)' : 'var(--warning)' }}
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            {allOk && (
              <div
                className="mt-4 p-3 rounded-lg text-xs text-center font-medium"
                style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}
              >
                ✓ Estimate is ready — PDF unlocked
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
