import {
  SquarePen,
  Search,
  Dna,
  Calendar,
  Library,
  Palette,
  LayoutTemplate,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

// Navegação principal da sidebar (ordem do brandbook/mockup).
export const NAV_ITEMS: NavItem[] = [
  { label: 'Novo conteúdo', href: '/', icon: SquarePen },
  { label: 'Buscar conteúdo', href: '/buscar', icon: Search },
  { label: 'DNA', href: '/dna', icon: Dna },
  { label: 'Calendário', href: '/calendario', icon: Calendar },
  { label: 'Biblioteca', href: '/biblioteca', icon: Library },
  { label: 'Identidade Visual', href: '/identidade-visual', icon: Palette },
  { label: 'Base de Aplicações', href: '/base-aplicacoes', icon: LayoutTemplate },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]
