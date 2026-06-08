import { SignJWT, jwtVerify } from 'jose'
import { authConfig } from './config'

// Selagem JWT pura (jose, sem next/headers) — segura pro proxy e pra qualquer lugar.
// Sessão = cookie HttpOnly assinado (HS256) com o SESSION_SECRET. Guarda o MÍNIMO:
// identidade + tenant resolvido (nada sensível, nada de tokens do provedor).

const key = () => new TextEncoder().encode(authConfig.sessionSecret)

export type Session = {
  sub: string
  email: string
  name: string
  tenantId: string
}

/** Transação OIDC (entre o /sign-in e o /callback): state, nonce, PKCE verifier. */
export type AuthTx = {
  state: string
  nonce: string
  verifier: string
}

export async function sealSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key())
}

export async function openSession(jwt?: string): Promise<Session | null> {
  if (!jwt) return null
  try {
    const { payload } = await jwtVerify(jwt, key(), { algorithms: ['HS256'] })
    if (!payload.sub || !payload.tenantId) return null
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      tenantId: String(payload.tenantId),
    }
  } catch {
    return null
  }
}

export async function sealTx(tx: AuthTx): Promise<string> {
  return new SignJWT({ ...tx })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key())
}

export async function openTx(jwt?: string): Promise<AuthTx | null> {
  if (!jwt) return null
  try {
    const { payload } = await jwtVerify(jwt, key(), { algorithms: ['HS256'] })
    if (!payload.state || !payload.nonce || !payload.verifier) return null
    return { state: String(payload.state), nonce: String(payload.nonce), verifier: String(payload.verifier) }
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'infosaas_session'
export const TX_COOKIE = 'infosaas_tx'
