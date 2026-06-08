import { type NextRequest, NextResponse } from 'next/server'
import { authEnabled } from '@/lib/auth/config'
import { openSession, SESSION_COOKIE } from '@/lib/auth/jwt'

// Proxy (ex-middleware no Next 16) — checagem OTIMISTA: lê só o cookie e redireciona
// quem não tem sessão pro /sign-in. A auth de verdade fica no DAL/route handlers.
// Sem Logto configurado (dev) → não intercepta nada.

const PUBLIC_PREFIXES = ['/sign-in', '/callback', '/sign-out']

export default async function proxy(req: NextRequest) {
  if (!authEnabled) return NextResponse.next()

  const path = req.nextUrl.pathname
  if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const session = await openSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }
  return NextResponse.next()
}

// Roda em tudo, menos api (rotas se protegem sozinhas), estáticos e arquivos com extensão.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
