import { createHash, randomBytes } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authConfig, oidc, redirectUri } from './config'

// Fluxo OIDC Authorization Code + PKCE (S256), feito à mão (sem SDK), contra o Logto.
// Endpoints já validados em produção: /oidc/auth, /oidc/token, /oidc/jwks.

const b64url = (buf: Buffer) => buf.toString('base64url')

export function makePkce(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export const randomToken = () => b64url(randomBytes(16))

export function buildAuthUrl(opts: { state: string; nonce: string; challenge: string }): string {
  const u = new URL(oidc.authorization())
  u.searchParams.set('client_id', authConfig.appId)
  u.searchParams.set('redirect_uri', redirectUri())
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', authConfig.scopes.join(' '))
  u.searchParams.set('state', opts.state)
  u.searchParams.set('nonce', opts.nonce)
  u.searchParams.set('code_challenge', opts.challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}

export async function exchangeCode(
  code: string,
  verifier: string,
): Promise<{ idToken: string; accessToken: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: authConfig.appId,
    code_verifier: verifier,
  })
  const basic = Buffer.from(`${authConfig.appId}:${authConfig.appSecret}`).toString('base64')
  const res = await fetch(oidc.token(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body,
  })
  if (!res.ok) {
    throw new Error(`token exchange falhou: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { id_token: string; access_token: string }
  return { idToken: json.id_token, accessToken: json.access_token }
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null
const jwks = () => (_jwks ??= createRemoteJWKSet(new URL(oidc.jwks())))

export async function verifyIdToken(
  idToken: string,
  nonce: string,
): Promise<{ sub: string; email: string; name: string }> {
  const { payload } = await jwtVerify(idToken, jwks(), {
    issuer: oidc.issuer(),
    audience: authConfig.appId,
  })
  if (payload.nonce !== nonce) throw new Error('nonce inválido (possível replay)')
  return {
    sub: String(payload.sub),
    email: String(payload.email ?? ''),
    name: String(payload.name ?? payload.username ?? payload.email ?? ''),
  }
}

/** Logto sub → tenantId. Usa o cofre se DATABASE_URL existir; senão (dev) null. */
export async function resolveTenantForUser(sub: string): Promise<string | null> {
  if (!process.env.DATABASE_URL?.trim()) return null
  try {
    const { tenantForUser } = await import('@infosaas/cofre')
    return await tenantForUser(sub)
  } catch (err) {
    console.error('[auth] erro resolvendo tenant do usuário:', err)
    return null
  }
}
