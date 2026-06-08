import { cache } from 'react'
import { redirect } from 'next/navigation'
import { readSessionCookie } from './session'
import { authEnabled, authConfig } from './config'
import type { Session } from './jwt'

// Data Access Layer — única fonte de verdade da sessão (padrão recomendado no Next 16).
// `cache` memoiza por render. Auth real fica AQUI e nos route handlers, nunca só no proxy.
// Sem Logto configurado (dev) → sessão sintética no tenant default, app roda como hoje.

const DEV_SESSION: Session = {
  sub: 'dev',
  email: 'dev@local',
  name: 'Dev',
  tenantId: authConfig.defaultTenant,
}

export const getSession = cache(async (): Promise<Session | null> => {
  if (!authEnabled) return DEV_SESSION
  return readSessionCookie()
})

export const requireSession = cache(async (): Promise<Session> => {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
})

/** tenantId da requisição (redireciona p/ login se não autenticado). */
export async function getTenantId(): Promise<string> {
  return (await requireSession()).tenantId
}
