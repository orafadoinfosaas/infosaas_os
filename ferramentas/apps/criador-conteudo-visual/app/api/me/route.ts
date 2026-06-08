import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/dal'

// Usuário logado (pro UserMenu da sidebar). force-dynamic: lê o cookie de sessão.
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: { name: session.name, email: session.email, tenantId: session.tenantId },
  })
}
