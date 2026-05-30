import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Criador de Conteúdo Visual — Infosaas',
  description: 'Criação de criativos para Instagram com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
