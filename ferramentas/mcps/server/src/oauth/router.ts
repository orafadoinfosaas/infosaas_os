import express, { type Request, type Response } from "express";
import { tenantForUser } from "@infosaas/cofre";
import { ISSUER, RESOURCE } from "./config.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyMcpToken,
  signClientId,
  verifyClientId,
  verifyPkce,
  pkceChallenge,
  randomUrlToken,
  verifyLogtoIdToken,
} from "./crypto.js";
import { buildLogtoAuthUrl, exchangeLogtoCode } from "./logto.js";
import { loginTxStore, authCodeStore } from "./store.js";
import { DEFAULT_TENANT } from "../tenancy/store.js";

export const oauthRouter = express.Router();

async function safeTenant(sub: string): Promise<string> {
  try {
    return (await tenantForUser(sub)) ?? DEFAULT_TENANT;
  } catch {
    return DEFAULT_TENANT;
  }
}

// ── Metadata (RFC 9728 / RFC 8414) ───────────────────────────────────────────
function protectedResource(_req: Request, res: Response): void {
  res.json({ resource: RESOURCE(), authorization_servers: [ISSUER()] });
}
oauthRouter.get("/.well-known/oauth-protected-resource", protectedResource);
oauthRouter.get("/.well-known/oauth-protected-resource/mcp", protectedResource);

oauthRouter.get("/.well-known/oauth-authorization-server", (_req, res) => {
  res.json({
    issuer: ISSUER(),
    authorization_endpoint: `${ISSUER()}/authorize`,
    token_endpoint: `${ISSUER()}/token`,
    registration_endpoint: `${ISSUER()}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "profile", "email"],
  });
});

// ── Dynamic Client Registration (RFC 7591) — stateless: client_id = JWT assinado ─
oauthRouter.post("/register", async (req: Request, res: Response) => {
  const ru = (req.body as { redirect_uris?: unknown })?.redirect_uris;
  if (!Array.isArray(ru) || ru.length === 0 || !ru.every((u) => typeof u === "string")) {
    res.status(400).json({ error: "invalid_redirect_uri", error_description: "redirect_uris obrigatório" });
    return;
  }
  const clientId = await signClientId(ru as string[]);
  res.status(201).json({
    client_id: clientId,
    redirect_uris: ru,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
});

// ── /authorize → valida e redireciona pro login do Logto ─────────────────────
oauthRouter.get("/authorize", async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const clientId = q.client_id ?? "";
  const redirectUri = q.redirect_uri ?? "";
  const codeChallenge = q.code_challenge ?? "";
  const method = q.code_challenge_method ?? "";
  const state = q.state ?? "";
  const responseType = q.response_type ?? "";

  // Antes de validar o redirect_uri, NUNCA redirecionar (open-redirect): erra com 400.
  const client = await verifyClientId(clientId);
  if (!client) {
    res.status(400).send("client_id inválido");
    return;
  }
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
    res.status(400).send("redirect_uri inválido (não registrado)");
    return;
  }
  // A partir daqui, erros voltam pro cliente via redirect.
  const fail = (err: string) =>
    res.redirect(`${redirectUri}?error=${encodeURIComponent(err)}${state ? `&state=${encodeURIComponent(state)}` : ""}`);
  if (responseType !== "code") return fail("unsupported_response_type");
  if (!codeChallenge || method !== "S256") return fail("invalid_request");

  // Perna de login no Logto (PKCE próprio MCP↔Logto).
  const logtoVerifier = randomUrlToken(32);
  const logtoNonce = randomUrlToken(16);
  const txId = randomUrlToken(24);
  loginTxStore.set(
    txId,
    { clientRedirectUri: redirectUri, clientState: state, clientCodeChallenge: codeChallenge, logtoVerifier, logtoNonce },
    10 * 60 * 1000,
  );
  return res.redirect(buildLogtoAuthUrl({ state: txId, nonce: logtoNonce, challenge: pkceChallenge(logtoVerifier) }));
});

// ── Callback do Logto → emite auth code do MCP e volta pro conector ──────────
oauthRouter.get("/oauth/logto/callback", async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const tx = loginTxStore.take(q.state ?? "");
  if (!tx) {
    res.status(400).send("Login expirado ou inválido. Conecte novamente.");
    return;
  }
  const back = (err: string) =>
    res.redirect(
      `${tx.clientRedirectUri}?error=${encodeURIComponent(err)}${tx.clientState ? `&state=${encodeURIComponent(tx.clientState)}` : ""}`,
    );
  if (q.error) return back(String(q.error));
  if (!q.code) return back("access_denied");

  try {
    const { idToken } = await exchangeLogtoCode(q.code, tx.logtoVerifier);
    const claims = await verifyLogtoIdToken(idToken, tx.logtoNonce);
    const mcpCode = randomUrlToken(32);
    authCodeStore.set(
      mcpCode,
      {
        sub: claims.sub,
        email: claims.email,
        clientCodeChallenge: tx.clientCodeChallenge,
        clientRedirectUri: tx.clientRedirectUri,
      },
      5 * 60 * 1000,
    );
    return res.redirect(
      `${tx.clientRedirectUri}?code=${encodeURIComponent(mcpCode)}${tx.clientState ? `&state=${encodeURIComponent(tx.clientState)}` : ""}`,
    );
  } catch (err) {
    console.error("[oauth] callback Logto falhou:", err);
    return back("server_error");
  }
});

// ── /token → troca code (PKCE) ou refresh por access token do MCP ────────────
oauthRouter.post("/token", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, string | undefined>;
  const grant = body.grant_type ?? "";

  if (grant === "authorization_code") {
    const ac = authCodeStore.take(body.code ?? "");
    if (!ac) {
      res.status(400).json({ error: "invalid_grant", error_description: "code inválido/expirado" });
      return;
    }
    if (ac.clientRedirectUri !== (body.redirect_uri ?? "")) {
      res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri não confere" });
      return;
    }
    if (!verifyPkce(body.code_verifier ?? "", ac.clientCodeChallenge)) {
      res.status(400).json({ error: "invalid_grant", error_description: "PKCE falhou" });
      return;
    }
    const tenant = await safeTenant(ac.sub);
    res.json({
      access_token: await signAccessToken({ sub: ac.sub, email: ac.email, tenant }, 3600),
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: await signRefreshToken({ sub: ac.sub, email: ac.email }),
      scope: "openid profile email",
    });
    return;
  }

  if (grant === "refresh_token") {
    const v = await verifyMcpToken(body.refresh_token ?? "", "refresh");
    if (!v) {
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
    const tenant = await safeTenant(v.sub);
    res.json({
      access_token: await signAccessToken({ sub: v.sub, email: v.email, tenant }, 3600),
      token_type: "Bearer",
      expires_in: 3600,
      scope: "openid profile email",
    });
    return;
  }

  res.status(400).json({ error: "unsupported_grant_type" });
});
