'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, FolderOpen,
  DollarSign, Settings, ChevronRight, HardHat
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Estimates',  href: '/dashboard/estimates',  icon: FileText },
  { label: 'Clients',    href: '/dashboard/clients',    icon: Users },
  { label: 'Projects',   href: '/dashboard/projects',   icon: FolderOpen },
  { label: 'Controller', href: '/dashboard/controller', icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{ background: 'var(--surface-900)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand-500)' }}
        >
          <HardHat size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <p
            className="text-sm font-semibold leading-tight"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-inverse)' }}
          >
            Gestão de Obra
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            jpera&CO
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'text-white'
                  : 'hover:bg-white/5'
              )}
              style={active ? {
                background: 'rgba(15, 110, 86, 0.25)',
                color: '#4ECCA3',
                borderLeft: '2px solid var(--brand-500)',
                paddingLeft: '10px',
              } : { color: 'rgba(255,255,255,0.5)' }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {active && (
                <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--brand-500)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <Settings size={16} strokeWidth={2} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
