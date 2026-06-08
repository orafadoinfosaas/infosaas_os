// Config da auth (Logto OIDC). Tudo via env — nada hardcoded. O app que você criou
// no Logto ("Next.js App Router" = confidential) dá APP_ID + APP_SECRET; o ENDPOINT
// é o core (https://auth.infosaas.ai). Sem LOGTO_APP_ID, a auth fica DESLIGADA
// (dev local roda como hoje, tenant default) — espelha o MCP_NO_AUTH do MCP.

export const authConfig = {
  endpoint: (process.env.LOGTO_ENDPOINT ?? '').replace(/\/$/, ''),
  appId: process.env.LOGTO_APP_ID ?? '',
  appSecret: process.env.LOGTO_APP_SECRET ?? '',
  baseUrl: (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me-please-32b',
  scopes: ['openid', 'profile', 'email'],
  defaultTenant: process.env.DEFAULT_TENANT ?? 'infosaas',
}

/** Auth ligada só quando o Logto está configurado. */
export const authEnabled = Boolean(authConfig.endpoint && authConfig.appId && authConfig.appSecret)

export const oidc = {
  authorization: () => `${authConfig.endpoint}/oidc/auth`,
  token: () => `${authConfig.endpoint}/oidc/token`,
  jwks: () => `${authConfig.endpoint}/oidc/jwks`,
  issuer: () => `${authConfig.endpoint}/oidc`,
  endSession: () => `${authConfig.endpoint}/oidc/session/end`,
}

export const redirectUri = () => `${authConfig.baseUrl}/callback`
