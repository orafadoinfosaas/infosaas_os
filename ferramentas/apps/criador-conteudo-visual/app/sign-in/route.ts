import { type NextRequest, NextResponse } from 'next/server'
import { authEnabled } from '@/lib/auth/config'
import { makePkce, randomToken, buildAuthUrl } from '@/lib/auth/oidc'
import { sealTx, TX_COOKIE } from '@/lib/auth/jwt'

// Inicia o login: gera PKCE + state + nonce, guarda numa transação assinada (cookie
// curto) e redireciona pra tela hospedada do Logto. Sem Logto → volta pra home (dev).
export async function GET(req: NextRequest) {
  if (!authEnabled) return NextResponse.redirect(new URL('/', req.url))

  const { verifier, challenge } = makePkce()
  const state = randomToken()
  const nonce = randomToken()

  const res = NextResponse.redirect(buildAuthUrl({ state, nonce, challenge }))
  res.cookies.set(TX_COOKIE, await sealTx({ state, nonce, verifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
