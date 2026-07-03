// Configuração central do Supabase.
// A chave anon JWT válida é usada como fonte da verdade. Caso o ambiente de build
// injete uma publishable key (sb_publishable_...) — que não é aceita pela API de
// auth — o código faz fallback para a JWT anon válida (que é pública por natureza).

const VALID_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eHFtc2dwbWJpbG1hampmYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzA3MzAsImV4cCI6MjA5MDcwNjczMH0.GTeV-iH2aWDF1v_SS9J10BhTihqU4HdWVjI6o7NnU-s'

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://owxqmsgpmbilmajjfaok.supabase.co'

function resolveAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // publishable keys (sb_publishable_...) não funcionam na API de auth → usar JWT válida
  if (!envKey || envKey.startsWith('sb_publishable_') || !envKey.startsWith('ey')) {
    return VALID_ANON_JWT
  }
  return envKey
}

export const SUPABASE_ANON_KEY = resolveAnonKey()
