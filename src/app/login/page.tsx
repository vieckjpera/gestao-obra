'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-1)]">
      <div className="w-full max-w-sm bg-[var(--surface-2)] rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-syne text-2xl font-bold text-[var(--brand-500)]">ConstructOS</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Gestão de obras simplificada</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg border border-[var(--surface-50)] bg-[var(--surface-1)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              placeholder="voce@empresa.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded-lg border border-[var(--surface-50)] bg-[var(--surface-1)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[var(--brand-500)] text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
