'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav'
import { RecentCreations } from './RecentCreations'

type Props = {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`flex-none h-screen sticky top-0 bg-[#f9f9f9] flex flex-col transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo + toggle */}
      <div className="h-14 flex-none flex items-center gap-1 px-3">
        {!collapsed && (
          <Link href="/" className="flex items-center min-w-0 px-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-black.svg" alt="infosaas" className="h-4 w-auto" />
          </Link>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`grid place-items-center w-9 h-9 rounded-lg text-[#5d5d5d] hover:bg-black/5 transition-colors ${
            collapsed ? 'mx-auto' : 'ml-auto'
          }`}
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-sm transition-colors ${
                    active ? 'bg-black/[0.07] text-[#0d0d0d] font-medium' : 'text-[#3d3d3d] hover:bg-black/5'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={18} className="flex-none text-[#5d5d5d]" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {!collapsed && <RecentCreations />}
      </nav>
    </aside>
  )
}
