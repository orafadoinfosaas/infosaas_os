'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isEditor = pathname.startsWith('/editor')
  // No editor a sidebar nasce recolhida (mais espaço pro canvas); expande nas demais.
  const [collapsed, setCollapsed] = useState(isEditor)
  useEffect(() => setCollapsed(isEditor), [isEditor])

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 min-w-0 min-h-screen flex flex-col">{children}</main>
    </div>
  )
}
