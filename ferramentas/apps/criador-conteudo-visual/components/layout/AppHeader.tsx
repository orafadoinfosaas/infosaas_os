'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppHeader() {
  const pathname = usePathname()

  function navClass(active: boolean) {
    return `px-3 py-1.5 rounded text-xs transition-colors ${
      active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
    }`
  }

  return (
    <header className="flex-none flex items-center justify-between px-5 py-2.5 border-b border-white/8 bg-[#0A0A0A]">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase text-[#FF3D00]">Infosaas®</span>
        <span className="text-white/20 text-xs">Criador Visual</span>
      </div>
      <nav className="flex gap-1">
        <Link href="/" className={navClass(pathname === '/')}>
          Criar
        </Link>
        <Link href="/library" className={navClass(pathname === '/library')}>
          Biblioteca
        </Link>
      </nav>
    </header>
  )
}
