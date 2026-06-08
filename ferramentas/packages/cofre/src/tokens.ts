import { randomBytes, createHash } from "node:crypto";

// Token MCP do tenant: opaco, mostrado UMA vez ao cliente; no cofre guardamos só o
// HASH (sha256). Resolução = hash do token recebido → lookup. Revogável.
export function generateToken(): string {
  return "inf_" + randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
