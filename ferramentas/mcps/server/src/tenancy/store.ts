import { timingSafeEqual } from "node:crypto";
import { resolveTokenToTenant } from "@infosaas/cofre";

// Tenant default (single-tenant atual). Mantém o `infosaas` no ar.
export const DEFAULT_TENANT = process.env.TENANT_ID ?? "infosaas";

// Backing do registro: se DATABASE_URL existe → COFRE (Postgres, via @infosaas/cofre);
// senão → ENV (TENANTS_JSON + MCP_TOKEN). A interface (tenantForToken) não muda —
// só o backing. P0 usava ENV; P1b liga o cofre.
export const USE_COFRE = !!process.env.DATABASE_URL?.trim();

type Entry = { tenantId: string; token: string };

function loadRegistry(): Entry[] {
  const entries: Entry[] = [];
  const raw = process.env.TENANTS_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Entry[];
      for (const e of parsed) {
        if (e?.tenantId && e?.token) entries.push({ tenantId: e.tenantId, token: e.token });
      }
    } catch {
      console.warn("[tenancy] TENANTS_JSON inválido (JSON malformado) — ignorado.");
    }
  }
  const mcpToken = process.env.MCP_TOKEN?.trim();
  if (mcpToken) entries.push({ tenantId: DEFAULT_TENANT, token: mcpToken });
  return entries;
}

// ENV registry SEMPRE carregado (mesmo no modo cofre) — serve de fallback, então
// ligar o cofre não derruba o `infosaas` (MCP_TOKEN) antes de ele ser semeado lá.
const REGISTRY = loadRegistry();

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function fromEnv(token: string): string | null {
  for (const e of REGISTRY) {
    if (constantTimeEquals(token, e.token)) return e.tenantId;
  }
  return null;
}

/** token → tenantId. null = desconhecido (→ 401). Cofre primeiro; ENV como fallback. */
export async function tenantForToken(token: string): Promise<string | null> {
  if (USE_COFRE) {
    try {
      const fromCofre = await resolveTokenToTenant(token);
      if (fromCofre) return fromCofre;
    } catch (err) {
      console.error("[tenancy] erro consultando o cofre (caindo p/ ENV):", err);
    }
  }
  return fromEnv(token);
}

/** Modo do registro (para log/health). */
export function storeMode(): "cofre" | "env" {
  return USE_COFRE ? "cofre" : "env";
}

/** Nº de tenants no fallback ENV (o cofre é dinâmico, não conta aqui). */
export function registrySize(): number {
  return REGISTRY.length;
}
