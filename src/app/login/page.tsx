'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react'

const DEMO_EMAIL = 'demo@constructos.com'
const DEMO_PASSWORD = 'Demo@2026'

type Mode = 'login' | 'reset' | 'reset-sent'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  if (message.includes('too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
  return `Erro ao entrar: ${message}`
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(em: string, pw: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw })
    if (error) return error
    router.push('/dashboard')
    router.refresh()
    return null
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError(mapAuthError(err.message))
      setLoading(false)
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true)
    setError(null)
    const err = await signIn(DEMO_EMAIL, DEMO_PASSWORD)
    if (err) {
      setError(mapAuthError(err.message))
      setDemoLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) {
      setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
    } else {
      setMode('reset-sent')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface-50)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Brand */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'var(--brand-500)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21L12 3L21 21H3Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <path d="M7 17H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
          >
            ConstructOS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' && 'Gestão de obras simplificada'}
            {mode === 'reset' && 'Recuperação de senha'}
            {mode === 'reset-sent' && 'E-mail enviado'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'white',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {mode === 'reset-sent' ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={36} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Verifique seu e-mail
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Enviamos um link de recuperação para <strong>{email}</strong>. Clique no link para criar uma nova senha.
              </p>
              <button
                className="text-xs font-medium mt-2"
                style={{ color: 'var(--brand-500)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                Voltar ao login
              </button>
            </div>
          ) : mode === 'reset' ? (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>
              <Input
                label="E-mail"
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
              />
              {error && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full justify-center">
                Enviar link de recuperação
              </Button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label="E-mail"
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                />
                <div className="flex flex-col gap-1">
                  <Input
                    label="Senha"
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs mt-1"
                      style={{ color: 'var(--brand-500)' }}
                      onClick={() => { setMode('reset'); setError(null) }}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}
                <Button type="submit" loading={loading} className="w-full justify-center">
                  Entrar
                </Button>
              </form>

              {/* Demo access */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs" style={{ background: 'white', color: 'var(--text-tertiary)' }}>
                    ou
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-surface-50 disabled:opacity-50"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <PlayCircle size={15} style={{ color: 'var(--brand-500)' }} />
                {demoLoading ? 'Entrando...' : 'Acessar como Demonstração'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
          © {new Date().getFullYear()} ConstructOS · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
