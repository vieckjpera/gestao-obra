import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestão de Obra',
  description: 'Sistema de gestão de construção — estimates, projetos e financeiro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
