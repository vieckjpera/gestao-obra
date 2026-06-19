'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Search, Filter, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, PageHeader, EmptyState, Input } from '@/components/ui'
import type { Estimate, EstimateStatus } from '@/types/database'

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft:    'Draft',
  ready:    'Ready',
  sent:     'Sent',
  approved: 'Approved',
  rejected: 'Rejected',
  expired:  'Expired',
}

const STATUS_VARIANT: Record<EstimateStatus, 'draft' | 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft:    'draft',
  ready:    'info',
  sent:     'warning',
  approved: 'success',
  rejected: 'danger',
  expired:  'default',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('estimates')
        .select('*, client:clients(id, name, email, phone, address, city, state, zip, notes, created_at, updated_at, org_id)')
        .order('created_at', { ascending: false })
      setEstimates((data as Estimate[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = estimates.filter(e =>
    !search ||
    e.estimate_number.toLowerCase().includes(search.toLowerCase()) ||
    e.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.scope?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-50)' }}>
      <PageHeader
        title="Estimates"
        subtitle={`${estimates.length} estimate${estimates.length !== 1 ? 's' : ''} total`}
        actions={
          <Link href="/dashboard/estimates/new">
            <Button icon={<Plus size={15} strokeWidth={2.5} />}>
              New Estimate
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="px-8 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-subtle)', background: 'white' }}>
        <div className="w-72">
          <Input
            placeholder="Search by number, client or scope…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search size={14} />}
          />
        </div>
        <Button variant="secondary" size="sm" icon={<Filter size={13} />}>Filter</Button>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="animate-stagger space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="surface-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-100 rounded w-48" />
                    <div className="h-3 bg-surface-100 rounded w-32" />
                  </div>
                  <div className="h-6 bg-surface-100 rounded-full w-16" />
                  <div className="h-5 bg-surface-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title={search ? 'No estimates found' : 'No estimates yet'}
            description={search ? 'Try a different search term.' : 'Create your first estimate to get started.'}
            action={
              !search && (
                <Link href="/dashboard/estimates/new">
                  <Button icon={<Plus size={15} />}>New Estimate</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="animate-stagger space-y-2">
            {filtered.map(estimate => (
              <Link
                key={estimate.id}
                href={`/dashboard/estimates/${estimate.id}`}
                className="surface-card p-5 flex items-center gap-5 hover:shadow-md transition-all duration-150 group block"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--surface-50)', border: '1px solid var(--border-subtle)' }}
                >
                  <FileText size={18} style={{ color: 'var(--brand-500)' }} />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}
                    >
                      {estimate.estimate_number}
                    </span>
                    <Badge variant={STATUS_VARIANT[estimate.status]}>
                      {STATUS_LABEL[estimate.status]}
                    </Badge>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    {estimate.client?.name} — {estimate.scope || 'No scope defined'}
                  </p>
                </div>

                {/* Values */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(estimate.total_with_margin)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {estimate.profit_margin_pct}% margin · {formatCurrency(estimate.grand_total)} base
                  </p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(estimate.created_at)}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowUpRight
                  size={16}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--brand-500)' }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
