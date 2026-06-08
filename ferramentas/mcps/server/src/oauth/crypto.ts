import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { oauthConfig, ISSUER, RESOURCE, logto } from "./config.js";

// Tudo assinado com HS256 + MCP_OAUTH_SECRET (o MCP é emissor E validador dos seus
// tokens — simétrico basta). O id_token do Logto é validado via JWKS (assimétrico).

const key = () => new TextEncoder().encode(oauthConfig.secret);

// ── Access / refresh tokens emitidos pelo MCP ────────────────────────────────
export async function signAccessToken(c: { sub: string; email: string; tenant: string }, ttlSec = 3600): Promise<string> {
  return new SignJWT({ email: c.email, tenant: c.tenant, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuer(ISSUER())
    .setAudience(RESOURCE())
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(key());
}

export async function signRefreshToken(c: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ email: c.email, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuer(ISSUER())
    .setAudience(RESOURCE())
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifyMcpToken(
  token: string,
  typ: "access" | "refresh" = "access",
): Promise<{ sub: string; email: string; tenant?: string } | null> {
  if (!oauthConfig.secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISSUER(), audience: RESOURCE() });
    if (payload.typ !== typ) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      tenant: payload.tenant ? String(payload.tenant) : undefined,
    };
  } catch {
    return null;
  }
}

// ── client_id como JWT assinado (DCR stateless: carrega os redirect_uris) ─────
export async function signClientId(redirectUris: string[]): Promise<string> {
  return new SignJWT({ ru: redirectUris, typ: "client" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(key());
}

export async function verifyClientId(clientId: string): Promise<{ redirectUris: string[] } | null> {
  try {
    const { payload } = await jwtVerify(clientId, key());
    if (payload.typ !== "client" || !Array.isArray(payload.ru)) return null;
    return { redirectUris: (payload.ru as unknown[]).map(String) };
  } catch {
    return null;
  }
}

// ── PKCE (S256) ──────────────────────────────────────────────────────────────
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  const computed = pkceChallenge(verifier);
  // comparação simples basta (challenge é público); evita timing só por higiene
  return computed.length === challenge.length && computed === challenge;
}
export function randomUrlToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

// ── id_token do Logto (JWKS) ─────────────────────────────────────────────────
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const jwks = () => (_jwks ??= createRemoteJWKSet(new URL(logto.jwks())));

export async function verifyLogtoIdToken(idToken: string, nonce: string): Promise<{ sub: string; email: string }> {
  const { payload } = await jwtVerify(idToken, jwks(), {
    issuer: logto.issuer(),
    audience: oauthConfig.logtoAppId,
  });
  if (payload.nonce !== nonce) throw new Error("nonce mismatch (possível replay)");
  return {
    sub: String(payload.sub),
    email: String(payload.email ?? payload.username ?? ""),
  };
}
