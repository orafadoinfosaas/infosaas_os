import path from "node:path";

/**
 * Raiz das pastas de cliente.
 * - Produção: CLIENTS_ROOT (mount do Nextcloud), ex. /mnt/clientes.
 * - Dev (CLIENTS_ROOT vazio): a raiz do próprio repo — lê o dna/ direto.
 *   process.cwd() roda em ferramentas/mcps/server → ../../.. = raiz do repo.
 */
const CLIENTS_ROOT = process.env.CLIENTS_ROOT?.trim();
const REPO_ROOT = process.env.REPO_ROOT?.trim() || path.resolve(process.cwd(), "../../..");

/** Pasta-raiz de um tenant. Em dev (sem CLIENTS_ROOT), usa o repo. */
export function tenantRoot(tenantId: string): string {
  return CLIENTS_ROOT ? path.resolve(CLIENTS_ROOT, tenantId) : REPO_ROOT;
}

/**
 * Resolve um caminho DENTRO da pasta do tenant. Bloqueia path traversal:
 * nenhum caminho com `..` pode escapar da raiz do tenant. CRÍTICO desde já —
 * é a base do isolamento multi-tenant da Fase 3.
 */
export function tenantPath(tenantId: string, ...parts: string[]): string {
  // resolve a base também — senão um REPO_ROOT cru (ex. "c:/..." com `/`) não
  // bate com o `full` resolvido (`C:\...` com `\`) e o anti-traversal dispara à toa.
  const base = path.resolve(tenantRoot(tenantId));
  const full = path.resolve(base, ...parts);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("path traversal bloqueado");
  }
  return full;
}
