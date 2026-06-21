'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, FileDown, User, Layers, DollarSign,
  CheckCircle2, AlertCircle, Calendar, Tag, Phone, Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, PageHeader } from '@/components/ui'
import type { Estimate, EstimateSection, EstimateItem, EstimateStatus } from '@/types/database'

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: 'Draft', ready: 'Ready', sent: 'Sent',
  approved: 'Approved', rejected: 'Rejected', expired: 'Expired',
}
const STATUS_VARIANT: Record<EstimateStatus, 'draft' | 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft: 'draft', ready: 'info', sent: 'warning',
  approved: 'success', rejected: 'danger', expired: 'default',
}

interface FullEstimate extends Estimate {
  sections: (EstimateSection & { items: EstimateItem[] })[]
}

export default function EstimateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [estimate, setEstimate] = useState<FullEstimate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('estimates')
        .select(`
          *,
          client:clients(*),
          service_type:service_types(*),
          sections:estimate_sections(
            *,
            items:estimate_items(* )
          )
        `)
        .eq('id', params.id)
        .single()

      if (data) {
        // Sort sections and items by sort_order
        const sorted = {
          ...data,
          sections: (data.sections || [])
            .sort((a: EstimateSection, b: EstimateSection) => a.sort_order - b.sort_order)
            .map((s: EstimateSection & { items: EstimateItem[] }) => ({
              ...s,
              items: (s.items || []).sort((a: EstimateItem, b: EstimateItem) => a.sort_order - b.sort_order),
            })),
        }
        setEstimate(sorted as FullEstimate)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
        ))}
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimate not found.</p>
        <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => router.back()}>
          Back
        </Button>
      </div>
    )
  }

  const checks = [
    { label: 'Client data complete',         ok: estimate.check_client_complete },
    { label: 'At least one section',         ok: estimate.check_has_sections },
    { label: 'All items have qty and price', ok: estimate.check_items_complete },
    { label: 'Profit margin defined',        ok: estimate.check_margin_defined },
    { label: 'No items with $0 total',       ok: estimate.check_no_zero_items },
  ]
  const allOk = checks.every(c => c.ok)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={estimate.estimate_number}
        subtitle={estimate.scope || 'No scope defined'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => router.back()}>
              Back
            </Button>
            <Badge variant={STATUS_VARIANT[estimate.status]}>{STATUS_LABEL[estimate.status]}</Badge>
            {allOk && (
              <Button size="sm" icon={<FileDown size={14} />} disabled>
                Generate PDF
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">

        {/* LEFT: Sections & Items */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Client Info */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={14} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Client & Project</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Client</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{estimate.client?.name || '—'}</p>
                {estimate.client?.email && (
                  <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <Mail size={11} />{estimate.client.email}
                  </p>
                )}
                {estimate.client?.phone && (
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={11} />{estimate.client.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {estimate.service_type && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Service Type</p>
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      <Tag size={12} />{estimate.service_type.name}
                    </p>
                  </div>
                )}
                {estimate.valid_until && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Valid Until</p>
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      <Calendar size={12} />{formatDate(estimate.valid_until)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="rounded-xl border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--surface-2)' }}>
              <Layers size={14} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
                Sections & Items
              </p>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                {estimate.sections.length} section{estimate.sections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {estimate.sections.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No sections found.</p>
              </div>
            ) : (
              estimate.sections.map((section) => {
                const sectionTotal = section.items.reduce((s, i) => s + i.line_total, 0)
                return (
                  <div key={section.id} className="border-b last:border-0" style={{ borderColor: 'var(--surface-2)' }}>
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--surface-50, #FAFAF8)' }}>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
                        {section.name}
                      </p>
                      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(sectionTotal)}
                      </p>
                    </div>

                    {/* Items Table Header */}
                    <div
                      className="grid text-xs px-5 py-2 font-medium"
                      style={{
                        gridTemplateColumns: '1fr 60px 70px 90px 80px 90px 100px',
                        color: 'var(--text-tertiary)',
                        borderBottom: '1px solid var(--surface-2)',
                      }}
                    >
                      <span>Description</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Unit</span>
                      <span className="text-right">Unit $</span>
                      <span className="text-right">Labor hrs</span>
                      <span className="text-right">Labor rate</span>
                      <span className="text-right">Total</span>
                    </div>

                    {/* Items */}
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid items-center px-5 py-2.5 hover:bg-surface-50 transition-colors"
                        style={{
                          gridTemplateColumns: '1fr 60px 70px 90px 80px 90px 100px',
                          borderBottom: '1px solid var(--surface-2)',
                        }}
                      >
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.description}</p>
                          {item.vendor_notes && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.vendor_notes}</p>
                          )}
                        </div>
                        <p className="text-sm font-mono text-right" style={{ color: 'var(--text-secondary)' }}>{item.qty}</p>
                        <p className="text-sm text-right" style={{ color: 'var(--text-tertiary)' }}>{item.unit || '—'}</p>
                        <p className="text-sm font-mono text-right" style={{ color: 'var(--text-secondary)' }}>{formatUSD(item.unit_price)}</p>
                        <p className="text-sm font-mono text-right" style={{ color: item.labor_hours > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                          {item.labor_hours > 0 ? item.labor_hours + 'h' : '—'}
                        </p>
                        <p className="text-sm font-mono text-right" style={{ color: item.labor_rate > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                          {item.labor_rate > 0 ? formatUSD(item.labor_rate) : '—'}
                        </p>
                        <p className="text-sm font-mono font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                          {formatUSD(item.line_total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT: Totals + Checklist */}
        <div className="flex flex-col gap-4">

          {/* Totals */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Totals</p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Materials',   value: estimate.subtotal_materials },
                { label: 'Labor',       value: estimate.subtotal_labor },
                { label: 'Other',       value: estimate.subtotal_other },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatUSD(value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-1" style={{ borderColor: 'var(--surface-2)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Grand Total</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{formatUSD(estimate.grand_total)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="font-semibold" style={{ color: 'var(--brand-600)' }}>
                    With {estimate.profit_margin_pct}% margin
                  </span>
                  <span className="font-mono font-bold text-base" style={{ color: 'var(--brand-600)' }}>
                    {formatUSD(estimate.total_with_margin)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--surface-2)', color: 'var(--text-tertiary)' }}>
              Created {formatDate(estimate.created_at)}
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Checklist</p>
              <Badge variant={allOk ? 'success' : 'draft'}>{allOk ? 'Ready' : checks.filter(c => !c.ok).length + ' pending'}</Badge>
            </div>
            <div className="flex flex-col gap-2.5">
              {checks.map((check, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {check.ok
                    ? <CheckCircle2 size={15} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
                    : <AlertCircle  size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  }
                  <span className="text-sm" style={{ color: check.ok ? 'var(--text-secondary)' : 'var(--warning)' }}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
