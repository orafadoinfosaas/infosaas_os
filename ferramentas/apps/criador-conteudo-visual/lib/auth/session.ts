import { cookies } from 'next/headers'
import { openSession, SESSION_COOKIE, type Session } from './jwt'

// Leitura do cookie de sessão via next/headers (async no Next 16). Usado pelo DAL
// e por Server Components. As ROTAS gravam o cookie direto no NextResponse.

export async function readSessionCookie(): Promise<Session | null> {
  const store = await cookies()
  return openSession(store.get(SESSION_COOKIE)?.value)
}
