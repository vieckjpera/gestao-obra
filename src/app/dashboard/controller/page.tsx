'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui'
import type { Estimate } from '@/types/database'
import { useT } from '@/lib/i18n'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
    </div>
  )
}

export default function ControllerPage() {
  const { t } = useT()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('estimates')
        .select('*')
        .order('created_at', { ascending: false })
      setEstimates((data as Estimate[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const approved = estimates.filter(e => e.status === 'approved')
  const draft    = estimates.filter(e => ['draft','ready','sent'].includes(e.status))

  const totalApproved   = approved.reduce((s, e) => s + e.total_with_margin, 0)
  const totalPipeline   = draft.reduce((s, e) => s + e.total_with_margin, 0)
  const totalMaterials  = approved.reduce((s, e) => s + e.subtotal_materials, 0)
  const totalLabor      = approved.reduce((s, e) => s + e.subtotal_labor, 0)
  const avgMargin       = approved.length > 0
    ? approved.reduce((s, e) => s + e.profit_margin_pct, 0) / approved.length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('controller.title')}
        subtitle={t('controller.subtitle')}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<DollarSign size={16} style={{ color: 'var(--brand-600)' }} />}
              label={t('controller.approvedRevenue')}
              value={formatCurrency(totalApproved)}
              sub={`${approved.length} ${approved.length !== 1 ? t('controller.approvedPlural') : t('controller.approvedSingular')}`}
              color="var(--brand-600)"
            />
            <StatCard
              icon={<TrendingUp size={16} style={{ color: '#F59E0B' }} />}
              label={t('controller.pipeline')}
              value={formatCurrency(totalPipeline)}
              sub={`${draft.length} ${draft.length !== 1 ? t('controller.pendingPlural') : t('controller.pendingSingular')}`}
            />
            <StatCard
              icon={<TrendingDown size={16} style={{ color: 'var(--text-secondary)' }} />}
              label={t('controller.materialsCost')}
              value={formatCurrency(totalMaterials)}
              sub={t('controller.approvedOnly')}
            />
            <StatCard
              icon={<FileText size={16} style={{ color: 'var(--text-secondary)' }} />}
              label={t('controller.avgMargin')}
              value={`${avgMargin.toFixed(1)}%`}
              sub={t('controller.acrossApproved')}
            />
          </div>

          <div className="rounded-xl border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--surface-2)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('controller.recentEstimates')}</p>
            </div>
            {estimates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('controller.noEstimates')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--surface-2)' }}>
                    {[t('controller.thEstimate'), t('controller.thMaterials'), t('controller.thLabor'), t('controller.thTotal'), t('controller.thMargin')].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimates.slice(0,10).map(e => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-surface-50" style={{ borderColor: 'var(--surface-2)' }}>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{e.estimate_number}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(e.subtotal_materials)}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(e.subtotal_labor)}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: 'var(--brand-600)' }}>{formatCurrency(e.total_with_margin)}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{e.profit_margin_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}