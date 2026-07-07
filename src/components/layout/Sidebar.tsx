'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, FolderOpen,
  DollarSign, Settings, ChevronRight, HardHat, Languages, X
} from 'lucide-react'
import clsx from 'clsx'
import { useT, type TranslationKey } from '@/lib/i18n'
import { useSidebar } from './sidebar-context'

const NAV: { key: TranslationKey; href: string; icon: typeof LayoutDashboard }[] = [
  { key: 'nav.dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { key: 'nav.estimates',  href: '/dashboard/estimates',  icon: FileText },
  { key: 'nav.clients',    href: '/dashboard/clients',    icon: Users },
  { key: 'nav.projects',   href: '/dashboard/projects',   icon: FolderOpen },
  { key: 'nav.controller', href: '/dashboard/controller', icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()
  const { lang, setLang, t } = useT()
  const { isOpen, close } = useSidebar()

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-60 flex flex-col z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ background: 'var(--surface-900)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
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
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'var(--text-inverse)' }}
            >
              ConstructOS
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t('nav.brand.sub')}
            </p>
          </div>
          <button
            onClick={close}
            className="ml-auto md:hidden p-1 rounded-lg hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  active ? 'text-white' : 'hover:bg-white/5'
                )}
                style={active ? {
                  background: 'rgba(15, 110, 86, 0.25)',
                  color: '#4ECCA3',
                  borderLeft: '2px solid var(--brand-500)',
                  paddingLeft: '10px',
                } : { color: 'rgba(255,255,255,0.5)' }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{t(key)}</span>
                {active && (
                  <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--brand-500)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t flex flex-col gap-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm transition-all duration-150 hover:bg-white/5 w-full text-left"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <Languages size={16} strokeWidth={2} />
            <span>{lang === 'pt' ? 'Português' : 'English'}</span>
            <span
              className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(15, 110, 86, 0.3)', color: '#4ECCA3' }}
            >
              {lang.toUpperCase()}
            </span>
          </button>

          <Link
            href="/dashboard/settings"
            onClick={close}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <Settings size={16} strokeWidth={2} />
            <span>{t('nav.settings')}</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
