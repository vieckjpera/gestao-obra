'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Folder, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, PageHeader } from '@/components/ui'
import type { Estimate, EstimateStatus } from '@/types/database'

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: 'Draft', ready: 'Ready', sent: 'Sent',
  approved: 'Approved', rejected: 'Rejected', expired: 'Expired',
}
const STATUS_VARIANT: Record<EstimateStatus, 'draft' | 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft: 'draft', ready: 'info', sent: 'warning',
  approved: 'success', rejected: 'danger', expired: 'default',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function ProjectsPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('estimates')
        .select('*, client:clients(id, name, email, phone, address, city, state, zip, notes, created_at, updated_at, org_id)')
        .in('status', ['approved', 'sent', 'ready'])
        .order('created_at', { ascending: false })
      setEstimates((data as Estimate[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        subtitle="Estimates approved or in progress"
        actions={
          <Link href="/dashboard/estimates/new">
            <Button icon={<Plus size={16} />}>New Estimate</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
        </div>
      ) : estimates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
            <Folder size={28} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No active projects</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Approved or sent estimates will appear here.</p>
          </div>
          <Link href="/dashboard/estimates/new">
            <Button icon={<Plus size={16} />}>Create Estimate</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {estimates.map(e => (
            <div key={e.id} className="rounded-xl border p-5 flex items-center justify-between hover:shadow-sm transition-shadow" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-100)' }}>
                  <Folder size={18} style={{ color: 'var(--brand-700)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{e.client?.name || 'Unknown client'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{e.estimate_number} · {e.scope || 'No scope'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(e.total_with_margin)}</p>
                <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                <Link href={`/dashboard/estimates/${e.id}`}>
                  <Button variant="ghost" size="sm" icon={<ArrowUpRight size={14} />}>View</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}