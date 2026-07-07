'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react'
import { useT, type TranslationKey } from '@/lib/i18n'

const DEMO_EMAIL = 'demo@constructos.com'
const DEMO_PASSWORD = 'Demo@2026'

type Mode = 'login' | 'reset' | 'reset-sent' | 'signup' | 'signup-sent'



export default function LoginPage() {
  const { t, lang, setLang } = useT()
  const router = useRouter()
  const supabase = createClient()

  function mapAuthError(message: string): string {
    if (message.includes('Invalid login credentials')) return t('login.errInvalid')
    if (message.includes('Email not confirmed')) return t('login.errNotConfirmed')
    if (message.includes('too many requests')) return t('login.errTooMany')
    return `${t('login.errGeneric')} ${message}`
  }
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError(t('login.errWeakPassword')); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setError(t('login.errSignup'))
    } else if (data.session) {
      // Sessão imediata (confirmação de e-mail desativada) → vai pro onboarding
      router.push('/onboarding')
      router.refresh()
    } else {
      // Precisa confirmar e-mail
      setMode('signup-sent')
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
      setError(t('login.errReset'))
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
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            ConstructOS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' && t('login.tagline')}
            {mode === 'reset' && t('login.resetTitle')}
            {mode === 'reset-sent' && t('login.resetSentTitle')}
            {mode === 'signup' && t('login.signupTitle')}
            {mode === 'signup-sent' && t('login.signupSentTitle')}
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
          {mode === 'signup-sent' ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={36} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('login.signupSentTitle')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('login.signupSentDesc')} <strong>{email}</strong>. {t('login.signupSentDesc2')}
              </p>
              <button
                className="text-xs font-medium mt-2"
                style={{ color: 'var(--brand-500)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                {t('login.backToLogin')}
              </button>
            </div>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <Input
                label={t('login.email')}
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
              />
              <Input
                label={t('login.password')}
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {error && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full justify-center">
                {t('login.createAccount')}
              </Button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                {t('login.loginCta')}
              </button>
            </form>
          ) : mode === 'reset-sent' ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={36} style={{ color: 'var(--brand-500)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('login.checkEmail')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('login.resetSentDesc')} <strong>{email}</strong>. {t('login.resetSentDesc2')}
              </p>
              <button
                className="text-xs font-medium mt-2"
                style={{ color: 'var(--brand-500)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                {t('login.backToLogin')}
              </button>
            </div>
          ) : mode === 'reset' ? (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('login.resetInstructions')}
              </p>
              <Input
                label={t('login.email')}
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
              />
              {error && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full justify-center">
                {t('login.sendResetLink')}
              </Button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={() => { setMode('login'); setError(null) }}
              >
                {t('login.backToLogin')}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label={t('login.email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                />
                <div className="flex flex-col gap-1">
                  <Input
                    label={t('login.password')}
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
                      {t('login.forgot')}
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
                  {t('login.signIn')}
                </Button>
              </form>

              {/* Demo access */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs" style={{ background: 'white', color: 'var(--text-tertiary)' }}>
                    {t('login.or')}
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
                {demoLoading ? t('login.demoLoading') : t('login.demo')}
              </button>

              <button
                type="button"
                className="text-xs text-center mt-1"
                style={{ color: 'var(--brand-500)' }}
                onClick={() => { setMode('signup'); setError(null) }}
              >
                {t('login.signupCta')}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-surface-50"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            {lang === 'pt' ? '🇺🇸 English' : '🇧🇷 Português'}
          </button>
          <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} ConstructOS · {t('login.footer')}
          </p>
        </div>
      </div>
    </div>
  )
}
