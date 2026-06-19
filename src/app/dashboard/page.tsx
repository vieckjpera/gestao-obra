import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Total Estimates',  value: '—', icon: FileText,   color: '#0F6E56' },
  { label: 'Active Clients',   value: '—', icon: Users,      color: '#2563EB' },
  { label: 'Revenue (MTD)',    value: '—', icon: DollarSign,  color: '#D97706' },
  { label: 'Avg Margin',       value: '—', icon: TrendingUp,  color: '#7C3AED' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-50)' }}>
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'white' }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Welcome back — here's what's happening
        </p>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8 animate-stagger">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="surface-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: color + '15' }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Placeholder */}
        <div className="surface-card p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
          <p className="text-sm">Full dashboard coming in the next sprint.</p>
          <p className="text-xs mt-1">Start by creating your first estimate →</p>
        </div>
      </div>
    </div>
  )
}
