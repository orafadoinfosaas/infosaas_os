// Config do Authorization Server OAuth do MCP. O MCP é o AS que os conectores
// (Claude/ChatGPT) enxergam; delega o LOGIN ao Logto (que não tem DCR) e emite os
// PRÓPRIOS tokens. Tudo via env. Sem env completo → OAuth desligado (segue só Bearer/ENV).

export const oauthConfig = {
  publicUrl: (process.env.MCP_PUBLIC_URL ?? "").replace(/\/$/, ""), // https://mcp.infosaas.ai
  logtoEndpoint: (process.env.LOGTO_ENDPOINT ?? "").replace(/\/$/, ""),
  logtoAppId: process.env.LOGTO_MCP_APP_ID ?? "",
  logtoAppSecret: process.env.LOGTO_MCP_APP_SECRET ?? "",
  secret: process.env.MCP_OAUTH_SECRET ?? "", // assina tokens/client_id (HS256), base64 32B
};

export const oauthEnabled = Boolean(
  oauthConfig.publicUrl &&
    oauthConfig.logtoEndpoint &&
    oauthConfig.logtoAppId &&
    oauthConfig.logtoAppSecret &&
    oauthConfig.secret,
);

export const ISSUER = () => oauthConfig.publicUrl;
export const RESOURCE = () => `${oauthConfig.publicUrl}/mcp`;
export const PROTECTED_RESOURCE_METADATA = () => `${oauthConfig.publicUrl}/.well-known/oauth-protected-resource`;

export const logto = {
  authorization: () => `${oauthConfig.logtoEndpoint}/oidc/auth`,
  token: () => `${oauthConfig.logtoEndpoint}/oidc/token`,
  jwks: () => `${oauthConfig.logtoEndpoint}/oidc/jwks`,
  issuer: () => `${oauthConfig.logtoEndpoint}/oidc`,
};

export const logtoRedirectUri = () => `${oauthConfig.publicUrl}/oauth/logto/callback`;
