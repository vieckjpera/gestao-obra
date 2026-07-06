'use client'

import { Menu, HardHat } from 'lucide-react'
import { useSidebar } from './sidebar-context'

export function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b"
      style={{ background: 'white', borderColor: 'var(--border-subtle)' }}
    >
      <button
        onClick={open}
        className="p-2 -ml-2 rounded-lg hover:bg-black/5"
        style={{ color: 'var(--text-primary)' }}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'var(--brand-500)' }}
        >
          <HardHat size={13} color="white" strokeWidth={2.5} />
        </div>
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
        >
          ConstructOS
        </span>
      </div>
    </header>
  )
}
