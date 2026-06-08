import { type NextRequest, NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth/config'
import { exchangeCode, verifyIdToken, resolveTenantForUser } from '@/lib/auth/oidc'
import { sealSession, openTx, SESSION_COOKIE, TX_COOKIE } from '@/lib/auth/jwt'

// Retorno do Logto: valida state, troca code→tokens, verifica o id_token (JWKS+nonce),
// resolve o tenant (cofre, com fallback ao default) e grava o cookie de sessão.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const providerError = params.get('error')
  if (providerError) {
    return NextResponse.redirect(new URL(`/sign-in?e=${encodeURIComponent(providerError)}`, req.url))
  }

  const code = params.get('code')
  const state = params.get('state')
  const tx = await openTx(req.cookies.get(TX_COOKIE)?.value)
  if (!code || !state || !tx || tx.state !== state) {
    return NextResponse.redirect(new URL('/sign-in?e=invalid_state', req.url))
  }

  try {
    const { idToken } = await exchangeCode(code, tx.verifier)
    const claims = await verifyIdToken(idToken, tx.nonce)
    const tenantId = (await resolveTenantForUser(claims.sub)) ?? authConfig.defaultTenant

    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set(
      SESSION_COOKIE,
      await sealSession({ sub: claims.sub, email: claims.email, name: claims.name, tenantId }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      },
    )
    res.cookies.delete(TX_COOKIE)
    return res
  } catch (err) {
    console.error('[auth/callback] falhou:', err)
    return NextResponse.redirect(new URL('/sign-in?e=callback_failed', req.url))
  }
}
