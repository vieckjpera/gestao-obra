'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Users, DollarSign, TrendingUp, ArrowUpRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge, Button } from '@/components/ui'
import type { Estimate, EstimateStatus } from '@/types/database'
import { useT } from '@/lib/i18n'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}


const STATUS_VARIANT: Record<EstimateStatus, 'draft' | 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft: 'draft', ready: 'info', sent: 'warning',
  approved: 'success', rejected: 'danger', expired: 'default',
}

const STATUS_PIPELINE: EstimateStatus[] = ['draft', 'ready', 'sent']

export default function DashboardPage() {
  const { t } = useT()
  const STATUS_LABEL: Record<EstimateStatus, string> = {
    draft: t('status.draft'), ready: t('status.ready'), sent: t('status.sent'),
    approved: t('status.approved'), rejected: t('status.rejected'), expired: t('status.expired'),
  }
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: role } = await supabase.from('user_roles').select('org_id').eq('user_id', user.id).single()
      const orgId = role?.org_id
      const [{ data: ests }, { count }] = await Promise.all([
        supabase.from('estimates').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      ])
      setEstimates((ests as Estimate[]) || [])
      setClientCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const approved = estimates.filter(e => e.status === 'approved')
  const pipeline = estimates.filter(e => STATUS_PIPELINE.includes(e.status))
  const totalRevenue = approved.reduce((s, e) => s + e.total_with_margin, 0)
  const avgMargin = approved.length > 0
    ? approved.reduce((s, e) => s + e.profit_margin_pct, 0) / approved.length
    : 0

  const stats = [
    {
      label: t('dash.totalEstimates'),
      value: loading ? '—' : String(estimates.length),
      sub: loading ? '' : `${pipeline.length} ${t('dash.inProgress')}`,
      icon: FileText,
      color: '#0F6E56',
    },
    {
      label: t('dash.activeClients'),
      value: loading ? '—' : String(clientCount),
      sub: t('dash.registered'),
      icon: Users,
      color: '#2563EB',
    },
    {
      label: t('dash.approvedRevenue'),
      value: loading ? '—' : formatCurrency(totalRevenue),
      sub: `${approved.length} ${approved.length !== 1 ? t('dash.approvedPlural') : t('dash.approvedSingular')}`,
      icon: DollarSign,
      color: '#D97706',
    },
    {
      label: t('dash.avgMargin'),
      value: loading ? '—' : `${avgMargin.toFixed(1)}%`,
      sub: t('dash.avgMarginSub'),
      icon: TrendingUp,
      color: '#7C3AED',
    },
  ]

  // Status breakdown for pipeline chart
  const statusCounts: Partial<Record<EstimateStatus, number>> = {}
  estimates.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1 })

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-50)' }}>
      {/* Header */}
      <div className="px-4 md:px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'white' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
            {t('dash.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t('dash.subtitle')}
          </p>
        </div>
        <Link href="/dashboard/estimates/new">
          <Button icon={<Plus size={15} strokeWidth={2.5} />} size="sm">
            {t('dash.newEstimate')}
          </Button>
        </Link>
      </div>

      <div className="p-4 md:p-8 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="surface-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: color + '15' }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
              <p
                className="text-2xl font-bold mb-0.5"
                style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Estimates */}
          <div className="col-span-2 surface-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('dash.recentEstimates')}</p>
              <Link href="/dashboard/estimates" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--brand-500)' }}>
                {t('dash.viewAll')} <ArrowUpRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--surface-50)' }} />
                ))}
              </div>
            ) : estimates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dash.noEstimates')}</p>
                <Link href="/dashboard/estimates/new" className="text-xs mt-1 block" style={{ color: 'var(--brand-500)' }}>
                  {t('dash.createFirst')}
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {estimates.slice(0, 6).map(e => (
                  <Link
                    key={e.id}
                    href={`/dashboard/estimates/${e.id}`}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-50 transition-colors group"
                  >
                    <span
                      className="text-xs font-semibold w-20 flex-shrink-0"
                      style={{ fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}
                    >
                      {e.estimate_number}
                    </span>
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {(e as Estimate & { client?: { name: string } }).client?.name ?? '—'}
                    </span>
                    <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(e.total_with_margin)}
                    </span>
                    <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--brand-500)' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="surface-card p-5 flex flex-col gap-4">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('dash.byStatus')}</p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-8 rounded animate-pulse" style={{ background: 'var(--surface-50)' }} />)}
              </div>
            ) : estimates.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dash.noData')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(Object.entries(statusCounts) as [EstimateStatus, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const pct = Math.round((count / estimates.length) * 100)
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{STATUS_LABEL[status]}</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-100)' }}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: STATUS_VARIANT[status] === 'success' ? 'var(--brand-500)'
                                : STATUS_VARIANT[status] === 'warning' ? '#F59E0B'
                                : STATUS_VARIANT[status] === 'danger' ? '#EF4444'
                                : STATUS_VARIANT[status] === 'info' ? '#3B82F6'
                                : 'var(--text-tertiary)',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
