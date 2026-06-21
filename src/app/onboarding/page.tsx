'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Building2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = companyName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: companyName.trim(), slug, plan: 'mvp', active: true })
      .select('id')
      .single()

    if (orgErr || !org) {
      setError('Erro ao criar empresa. Tente novamente.')
      setLoading(false)
      return
    }

    const { error: roleErr } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, org_id: org.id, role: 'owner' })

    if (roleErr) {
      setError('Erro ao configurar acesso. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface-50)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'var(--brand-500)' }}
          >
            <Building2 size={22} color="white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
          >
            Configure sua empresa
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Vamos criar seu espaço de trabalho
          </p>
        </div>

        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'white',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nome da empresa"
              id="company"
              type="text"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Construtora Silva"
            />
            {error && (
              <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full justify-center">
              Criar espaço de trabalho
            </Button>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
          © {new Date().getFullYear()} ConstructOS · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
