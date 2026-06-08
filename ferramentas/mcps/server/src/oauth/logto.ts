import { oauthConfig, logto, logtoRedirectUri } from "./config.js";

// O MCP age como CLIENT do Logto só pra logar o usuário (OIDC code + PKCE).

export function buildLogtoAuthUrl(p: { state: string; nonce: string; challenge: string }): string {
  const u = new URL(logto.authorization());
  u.searchParams.set("client_id", oauthConfig.logtoAppId);
  u.searchParams.set("redirect_uri", logtoRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid profile email");
  u.searchParams.set("state", p.state);
  u.searchParams.set("nonce", p.nonce);
  u.searchParams.set("code_challenge", p.challenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

export async function exchangeLogtoCode(code: string, verifier: string): Promise<{ idToken: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: logtoRedirectUri(),
    client_id: oauthConfig.logtoAppId,
    code_verifier: verifier,
  });
  const basic = Buffer.from(`${oauthConfig.logtoAppId}:${oauthConfig.logtoAppSecret}`).toString("base64");
  const res = await fetch(logto.token(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
    body,
  });
  if (!res.ok) throw new Error(`logto token ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { id_token: string };
  return { idToken: json.id_token };
}
