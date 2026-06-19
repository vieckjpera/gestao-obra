# Gestão de Obra

SaaS de gestão de construção — estimates, controller financeiro e gestão de projetos.

## Stack

- **Frontend**: Next.js 14 (App Router)
- **Deploy**: Cloudflare Pages
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Automações**: N8N + Resend

## Módulos

- [x] Schema do banco (Supabase) — 10 tabelas, RLS, triggers
- [x] Módulo de Estimates — criação, seções, itens, checklist, cálculo de margem
- [ ] Módulo Controller — lançamentos contábeis, cash flow mensal
- [ ] Módulo Projetos — gestão de obras, margem planejada vs realizada
- [ ] Portal Homeowner — acompanhamento e aprovação de etapas

## Setup

```bash
npm install
cp .env.local.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```
