'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'pt' | 'en'

const dictionaries = {
  pt: {
    // Navegação
    'nav.dashboard': 'Dashboard',
    'nav.estimates': 'Orçamentos',
    'nav.clients': 'Clientes',
    'nav.projects': 'Projetos',
    'nav.controller': 'Financeiro',
    'nav.settings': 'Configurações',
    'nav.brand.sub': 'jpera&CO',

    // Login
    'login.tagline': 'Gestão de obras simplificada',
    'login.resetTitle': 'Recuperação de senha',
    'login.resetSentTitle': 'E-mail enviado',
    'login.email': 'E-mail',
    'login.emailPlaceholder': 'voce@empresa.com',
    'login.password': 'Senha',
    'login.forgot': 'Esqueceu a senha?',
    'login.signIn': 'Entrar',
    'login.or': 'ou',
    'login.demo': 'Acessar como Demonstração',
    'login.demoLoading': 'Entrando...',
    'login.checkEmail': 'Verifique seu e-mail',
    'login.resetSentDesc': 'Enviamos um link de recuperação para',
    'login.resetSentDesc2': 'Clique no link para criar uma nova senha.',
    'login.backToLogin': 'Voltar ao login',
    'login.resetInstructions': 'Informe seu e-mail e enviaremos um link para criar uma nova senha.',
    'login.sendResetLink': 'Enviar link de recuperação',
    'login.footer': 'Todos os direitos reservados',
    'login.signupTitle': 'Criar conta',
    'login.signup': 'Criar conta',
    'login.signupCta': 'Não tem conta? Cadastre-se',
    'login.loginCta': 'Já tem conta? Entrar',
    'login.createAccount': 'Criar conta',
    'login.signupSentTitle': 'Confirme seu e-mail',
    'login.signupSentDesc': 'Enviamos um link de confirmação para',
    'login.signupSentDesc2': 'Confirme para acessar sua conta.',
    'login.errSignup': 'Erro ao criar conta. O e-mail pode já estar em uso.',
    'login.errWeakPassword': 'A senha deve ter no mínimo 6 caracteres.',
    'login.errInvalid': 'E-mail ou senha inválidos.',
    'login.errNotConfirmed': 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
    'login.errTooMany': 'Muitas tentativas. Aguarde alguns minutos.',
    'login.errReset': 'Erro ao enviar e-mail. Verifique o endereço e tente novamente.',
    'login.errGeneric': 'Erro ao entrar:',

    // Status
    'status.draft': 'Rascunho',
    'status.ready': 'Pronto',
    'status.sent': 'Enviado',
    'status.approved': 'Aprovado',
    'status.rejected': 'Rejeitado',
    'status.expired': 'Expirado',

    // Dashboard
    'dash.title': 'Dashboard',
    'dash.subtitle': 'Visão geral da sua operação',
    'dash.newEstimate': 'Novo Orçamento',
    'dash.totalEstimates': 'Total de Orçamentos',
    'dash.inProgress': 'em andamento',
    'dash.activeClients': 'Clientes Ativos',
    'dash.registered': 'cadastrados',
    'dash.approvedRevenue': 'Receita Aprovada',
    'dash.approvedSingular': 'orçamento aprovado',
    'dash.approvedPlural': 'orçamentos aprovados',
    'dash.avgMargin': 'Margem Média',
    'dash.avgMarginSub': 'orçamentos aprovados',
    'dash.recentEstimates': 'Orçamentos Recentes',
    'dash.viewAll': 'Ver todos',
    'dash.noEstimates': 'Nenhum orçamento ainda.',
    'dash.createFirst': 'Criar o primeiro orçamento →',
    'dash.byStatus': 'Por Status',
    'dash.noData': 'Sem dados ainda.',

    // Clients
    'clients.title': 'Clientes',
    'clients.singular': 'cliente no total',
    'clients.plural': 'clientes no total',
    'clients.newClient': 'Novo Cliente',
    'clients.name': 'Nome',
    'clients.namePlaceholder': 'Nome completo ou empresa',
    'clients.email': 'E-mail',
    'clients.emailPlaceholder': 'email@exemplo.com',
    'clients.phone': 'Telefone',
    'clients.phonePlaceholder': '(555) 000-0000',
    'clients.city': 'Cidade',
    'clients.cityPlaceholder': 'Cidade',
    'clients.address': 'Endereço',
    'clients.addressPlaceholder': 'Endereço completo',
    'clients.cancel': 'Cancelar',
    'clients.save': 'Salvar Cliente',
    'clients.searchPlaceholder': 'Buscar por nome, e-mail ou cidade...',
    'clients.emptyTitle': 'Nenhum cliente ainda',
    'clients.emptyDesc': 'Adicione seu primeiro cliente para começar a criar orçamentos.',

    // Projects
    'projects.title': 'Projetos',
    'projects.subtitle': 'Orçamentos aprovados ou em andamento',
    'projects.newEstimate': 'Novo Orçamento',
    'projects.emptyTitle': 'Nenhum projeto ativo',
    'projects.emptyDesc': 'Orçamentos aprovados ou enviados aparecerão aqui.',
    'projects.createEstimate': 'Criar Orçamento',
    'projects.view': 'Ver',
    'projects.unknownClient': 'Cliente desconhecido',
    'projects.noScope': 'Sem escopo',

    // Controller
    'controller.title': 'Financeiro',
    'controller.subtitle': 'Visão financeira dos seus orçamentos',
    'controller.approvedRevenue': 'Receita Aprovada',
    'controller.pipeline': 'Pipeline',
    'controller.materialsCost': 'Custo de Materiais',
    'controller.avgMargin': 'Margem Média',
    'controller.approvedSingular': 'orçamento aprovado',
    'controller.approvedPlural': 'orçamentos aprovados',
    'controller.pendingSingular': 'orçamento pendente',
    'controller.pendingPlural': 'orçamentos pendentes',
    'controller.approvedOnly': 'Apenas orçamentos aprovados',
    'controller.acrossApproved': 'Entre orçamentos aprovados',
    'controller.recentEstimates': 'Orçamentos Recentes',
    'controller.noEstimates': 'Nenhum orçamento ainda. Crie o primeiro para ver os dados financeiros aqui.',
    'controller.thEstimate': 'Orçamento',
    'controller.thMaterials': 'Materiais',
    'controller.thLabor': 'Mão de obra',
    'controller.thTotal': 'Total c/ Margem',
    'controller.thMargin': 'Margem',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.estimates': 'Estimates',
    'nav.clients': 'Clients',
    'nav.projects': 'Projects',
    'nav.controller': 'Controller',
    'nav.settings': 'Settings',
    'nav.brand.sub': 'jpera&CO',

    // Login
    'login.tagline': 'Construction management made simple',
    'login.resetTitle': 'Password recovery',
    'login.resetSentTitle': 'Email sent',
    'login.email': 'Email',
    'login.emailPlaceholder': 'you@company.com',
    'login.password': 'Password',
    'login.forgot': 'Forgot password?',
    'login.signIn': 'Sign in',
    'login.or': 'or',
    'login.demo': 'Access as Demo',
    'login.demoLoading': 'Signing in...',
    'login.checkEmail': 'Check your email',
    'login.resetSentDesc': 'We sent a recovery link to',
    'login.resetSentDesc2': 'Click the link to create a new password.',
    'login.backToLogin': 'Back to login',
    'login.resetInstructions': 'Enter your email and we will send you a link to create a new password.',
    'login.sendResetLink': 'Send recovery link',
    'login.footer': 'All rights reserved',
    'login.signupTitle': 'Create account',
    'login.signup': 'Create account',
    'login.signupCta': "Don't have an account? Sign up",
    'login.loginCta': 'Already have an account? Sign in',
    'login.createAccount': 'Create account',
    'login.signupSentTitle': 'Confirm your email',
    'login.signupSentDesc': 'We sent a confirmation link to',
    'login.signupSentDesc2': 'Confirm to access your account.',
    'login.errSignup': 'Error creating account. The email may already be in use.',
    'login.errWeakPassword': 'Password must be at least 6 characters.',
    'login.errInvalid': 'Invalid email or password.',
    'login.errNotConfirmed': 'Confirm your email before signing in. Check your inbox.',
    'login.errTooMany': 'Too many attempts. Please wait a few minutes.',
    'login.errReset': 'Error sending email. Check the address and try again.',
    'login.errGeneric': 'Sign-in error:',

    // Status
    'status.draft': 'Draft',
    'status.ready': 'Ready',
    'status.sent': 'Sent',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.expired': 'Expired',

    // Dashboard
    'dash.title': 'Dashboard',
    'dash.subtitle': 'Overview of your operation',
    'dash.newEstimate': 'New Estimate',
    'dash.totalEstimates': 'Total Estimates',
    'dash.inProgress': 'in progress',
    'dash.activeClients': 'Active Clients',
    'dash.registered': 'registered',
    'dash.approvedRevenue': 'Approved Revenue',
    'dash.approvedSingular': 'approved estimate',
    'dash.approvedPlural': 'approved estimates',
    'dash.avgMargin': 'Avg Margin',
    'dash.avgMarginSub': 'approved estimates',
    'dash.recentEstimates': 'Recent Estimates',
    'dash.viewAll': 'View all',
    'dash.noEstimates': 'No estimates yet.',
    'dash.createFirst': 'Create your first estimate →',
    'dash.byStatus': 'By Status',
    'dash.noData': 'No data yet.',

    // Clients
    'clients.title': 'Clients',
    'clients.singular': 'client total',
    'clients.plural': 'clients total',
    'clients.newClient': 'New Client',
    'clients.name': 'Name',
    'clients.namePlaceholder': 'Full name or company',
    'clients.email': 'Email',
    'clients.emailPlaceholder': 'email@example.com',
    'clients.phone': 'Phone',
    'clients.phonePlaceholder': '(555) 000-0000',
    'clients.city': 'City',
    'clients.cityPlaceholder': 'City',
    'clients.address': 'Address',
    'clients.addressPlaceholder': 'Street address',
    'clients.cancel': 'Cancel',
    'clients.save': 'Save Client',
    'clients.searchPlaceholder': 'Search by name, email or city...',
    'clients.emptyTitle': 'No clients yet',
    'clients.emptyDesc': 'Add your first client to start creating estimates.',

    // Projects
    'projects.title': 'Projects',
    'projects.subtitle': 'Estimates approved or in progress',
    'projects.newEstimate': 'New Estimate',
    'projects.emptyTitle': 'No active projects',
    'projects.emptyDesc': 'Approved or sent estimates will appear here.',
    'projects.createEstimate': 'Create Estimate',
    'projects.view': 'View',
    'projects.unknownClient': 'Unknown client',
    'projects.noScope': 'No scope',

    // Controller
    'controller.title': 'Controller',
    'controller.subtitle': 'Financial overview from your estimates',
    'controller.approvedRevenue': 'Approved Revenue',
    'controller.pipeline': 'Pipeline',
    'controller.materialsCost': 'Materials Cost',
    'controller.avgMargin': 'Avg Margin',
    'controller.approvedSingular': 'approved estimate',
    'controller.approvedPlural': 'approved estimates',
    'controller.pendingSingular': 'pending estimate',
    'controller.pendingPlural': 'pending estimates',
    'controller.approvedOnly': 'Approved estimates only',
    'controller.acrossApproved': 'Across approved estimates',
    'controller.recentEstimates': 'Recent Estimates',
    'controller.noEstimates': 'No estimates yet. Create your first estimate to see financial data here.',
    'controller.thEstimate': 'Estimate',
    'controller.thMaterials': 'Materials',
    'controller.thLabor': 'Labor',
    'controller.thTotal': 'Total w/ Margin',
    'controller.thMargin': 'Margin',
  },
} as const

export type TranslationKey = keyof typeof dictionaries.pt

const STORAGE_KEY = 'constructos-lang'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'pt',
  setLang: () => {},
  t: (key) => dictionaries.pt[key] ?? key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored === 'pt' || stored === 'en') setLangState(stored)
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  function t(key: TranslationKey): string {
    return dictionaries[lang][key] ?? dictionaries.pt[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  return useContext(LanguageContext)
}
