'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PageHeader } from '@/components/ui'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

type Feedback = { type: 'success' | 'error'; message: string } | null

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null
  return (
    <div
      className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
      style={{
        background: feedback.type === 'success' ? '#F0FDF4' : '#FEF2F2',
        color: feedback.type === 'success' ? '#16A34A' : '#DC2626',
        border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
      }}
    >
      {feedback.type === 'success'
        ? <CheckCircle2 size={15} />
        : <AlertCircle size={15} />}
      {feedback.message}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>
      <div className="p-6 flex flex-col gap-4">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Company profile
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgLogoUrl, setOrgLogoUrl] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [canEditOrg, setCanEditOrg] = useState(false)
  const [orgFeedback, setOrgFeedback] = useState<Feedback>(null)
  const [orgLoading, setOrgLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setDisplayName(data.user?.user_metadata?.full_name ?? '')
    })
  }, [])

  useEffect(() => {
    async function loadOrg() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const { data: role } = await supabase
        .from('user_roles').select('org_id, role').eq('user_id', u.id).single()
      if (!role) return
      setCanEditOrg(role.role === 'owner' || role.role === 'admin')

      const { data: org } = await supabase
        .from('organizations').select('*').eq('id', role.org_id).single()
      if (org) {
        setOrgId(org.id)
        setOrgName(org.name ?? '')
        setOrgLogoUrl(org.logo_url ?? '')
        setOrgPhone(org.phone ?? '')
        setOrgEmail(org.email ?? '')
        setOrgAddress(org.address ?? '')
      }
    }
    loadOrg()
  }, [])

  async function handleOrgSave(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setOrgLoading(true)
    setOrgFeedback(null)
    const { error } = await supabase.from('organizations').update({
      name: orgName,
      logo_url: orgLogoUrl || null,
      phone: orgPhone || null,
      email: orgEmail || null,
      address: orgAddress || null,
    }).eq('id', orgId)
    setOrgLoading(false)
    setOrgFeedback(
      error
        ? { type: 'error', message: 'Erro ao salvar. Tente novamente.' }
        : { type: 'success', message: 'Perfil da empresa atualizado com sucesso.' }
    )
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileFeedback(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
    })
    setProfileLoading(false)
    setProfileFeedback(
      error
        ? { type: 'error', message: 'Erro ao salvar. Tente novamente.' }
        : { type: 'success', message: 'Perfil atualizado com sucesso.' }
    )
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'A senha deve ter pelo menos 8 caracteres.' })
      return
    }
    setPasswordLoading(true)
    setPasswordFeedback(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) {
      setPasswordFeedback({ type: 'error', message: 'Erro ao atualizar senha. Tente novamente.' })
    } else {
      setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências da conta" />

      {/* Profile */}
      <Section title="Perfil">
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Seu nome"
          />
          <Input
            label="E-mail"
            type="email"
            value={user?.email ?? ''}
            readOnly
            hint="O e-mail não pode ser alterado por aqui."
          />
          <FeedbackBanner feedback={profileFeedback} />
          <div>
            <Button type="submit" loading={profileLoading} size="sm">
              Salvar perfil
            </Button>
          </div>
        </form>
      </Section>

      {/* Company Profile */}
      <Section title="Perfil da empresa">
        <form onSubmit={handleOrgSave} className="flex flex-col gap-4">
          <p className="text-xs -mt-2" style={{ color: 'var(--text-secondary)' }}>
            Essas informações aparecem no PDF dos orçamentos enviados aos seus clientes.
          </p>
          <Input
            label="Nome da empresa"
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="Nome que aparece no orçamento"
          />
          <Input
            label="URL do logo"
            type="url"
            value={orgLogoUrl}
            onChange={e => setOrgLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
            hint="Cole o link de uma imagem já hospedada (ex: do seu site)."
          />
          {orgLogoUrl && (
            <img
              src={orgLogoUrl}
              alt="Preview do logo"
              className="h-12 object-contain rounded border p-1"
              style={{ borderColor: 'var(--border-subtle)' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              type="text"
              value={orgPhone}
              onChange={e => setOrgPhone(e.target.value)}
              placeholder="(555) 000-0000"
            />
            <Input
              label="E-mail de contato"
              type="email"
              value={orgEmail}
              onChange={e => setOrgEmail(e.target.value)}
              placeholder="contato@suaempresa.com"
            />
          </div>
          <Input
            label="Endereço"
            type="text"
            value={orgAddress}
            onChange={e => setOrgAddress(e.target.value)}
            placeholder="Endereço completo"
          />
          <FeedbackBanner feedback={orgFeedback} />
          <div>
            <Button type="submit" loading={orgLoading} size="sm" disabled={!canEditOrg}>
              Salvar perfil da empresa
            </Button>
            {!canEditOrg && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Apenas owner/admin podem editar o perfil da empresa.
              </p>
            )}
          </div>
        </form>
      </Section>

      {/* Security */}
      <Section title="Segurança">
        <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
          />
          <FeedbackBanner feedback={passwordFeedback} />
          <div>
            <Button type="submit" loading={passwordLoading} size="sm">
              Alterar senha
            </Button>
          </div>
        </form>
      </Section>

      {/* Danger zone */}
      <Section title="Sessão">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Encerrar sessão</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Você será redirecionado para a tela de login.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </Section>

      {/* Catalog */}
      <Section title="Catálogo de itens">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Produtos e serviços
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Cadastre os itens que aparecerão como checklist ao criar um orçamento.
            </p>
          </div>
          <a href="/dashboard/catalog">
            <Button variant="secondary" size="sm">Gerenciar catálogo</Button>
          </a>
        </div>
      </Section>
    </div>
  )
}
