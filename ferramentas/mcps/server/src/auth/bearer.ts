import type { Request } from "express";

/**
 * Fase 1: autenticação por token simples. Compara o Bearer do header
 * Authorization com MCP_TOKEN. Na Fase 3 isso vira OAuth 2.0 multi-tenant.
 */
export function checkBearer(req: Request): boolean {
  const expected = process.env.MCP_TOKEN;
  if (!expected) {
    console.warn("[auth] MCP_TOKEN não definido — recusando todas as requisições.");
    return false;
  }
  const header = req.headers.authorization ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 && timingSafeEqual(token, expected);
}

/** Comparação de tempo constante para não vazar o tamanho/conteúdo do token. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
