import { timingSafeEqual } from "node:crypto";

// Tenant default (single-tenant atual). Mantém o `infosaas` no ar enquanto o
// multi-tenant não está plugado.
export const DEFAULT_TENANT = process.env.TENANT_ID ?? "infosaas";

type Entry = { tenantId: string; token: string };

/**
 * Registro de tenants (P0): mapeia token → tenantId. Backing por ENV agora
 * (`TENANTS_JSON`); no P1 o painel troca isso por Postgres (cofre) SEM mudar quem
 * consome — `tenantForToken` continua a única porta.
 *
 * `TENANTS_JSON` = JSON: [{ "tenantId": "acme", "token": "..." }, ...]
 * Backward-compat: `MCP_TOKEN` (single-tenant atual) → DEFAULT_TENANT.
 */
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

// Carregado no boot (env não muda em runtime; redeploy recarrega).
const REGISTRY = loadRegistry();

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** token → tenantId (comparação de tempo constante). null = token desconhecido. */
export function tenantForToken(token: string): string | null {
  for (const e of REGISTRY) {
    if (constantTimeEquals(token, e.token)) return e.tenantId;
  }
  return null;
}

/** Quantos tenants estão registrados (para log/health). */
export function registrySize(): number {
  return REGISTRY.length;
}
