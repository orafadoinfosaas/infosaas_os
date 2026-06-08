import { type NextRequest, NextResponse } from 'next/server'
import { authConfig, authEnabled, oidc } from '@/lib/auth/config'
import { SESSION_COOKIE } from '@/lib/auth/jwt'

// Logout: limpa o cookie de sessão e encerra a sessão no Logto (end_session), voltando
// pra home. (Registrar a post_logout_redirect_uri no app do Logto.)
export async function GET(req: NextRequest) {
  let target: string
  if (authEnabled) {
    const u = new URL(oidc.endSession())
    u.searchParams.set('client_id', authConfig.appId)
    u.searchParams.set('post_logout_redirect_uri', authConfig.baseUrl)
    target = u.toString()
  } else {
    target = new URL('/', req.url).toString()
  }

  const res = NextResponse.redirect(target)
  res.cookies.delete(SESSION_COOKIE)
  return res
}
