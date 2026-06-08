import type { Request } from "express";
import { tenantForToken, DEFAULT_TENANT } from "./store.js";

function bearerToken(req: Request): string {
  return (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "").trim();
}

/**
 * Resolve o tenant da requisição PELO TOKEN — o token É a credencial e a identidade.
 * Retorna o tenantId, ou `null` se não autorizado (→ 401).
 *
 * - `MCP_NO_AUTH=true` (modo aberto, só teste): libera → tenant default.
 * - Token válido no registro → o tenant dele.
 * - Sem token / token desconhecido → null.
 *
 * No P1 (painel) o registro vira o cofre (Postgres); esta função não muda.
 */
export function resolveTenant(req: Request): string | null {
  if (process.env.MCP_NO_AUTH === "true") return DEFAULT_TENANT;
  const token = bearerToken(req);
  if (!token) return null;
  return tenantForToken(token);
}
