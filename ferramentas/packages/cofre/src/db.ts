import { Pool } from "pg";
import { hashToken, generateToken } from "./tokens.js";
import { encrypt, decrypt } from "./crypto.js";
import { migrations } from "./migrations.js";

// Chave do advisory lock que serializa o migrate() entre processos concorrentes
// (MCP e painel sobem ao mesmo tempo). Valor arbitrário, fixo p/ o cofre.
const MIGRATION_LOCK = 4296700001;

// Acesso ao cofre (Postgres). Conexão por DATABASE_URL. O MCP só LÊ
// (token→tenant, secrets); o painel ESCREVE (cria tenant, emite token, secrets).

let _pool: Pool | null = null;
function pool(): Pool {
  if (!_pool) {
    const cs = process.env.DATABASE_URL?.trim();
    if (!cs) throw new Error("DATABASE_URL ausente — defina a conexão do cofre (Postgres).");
    _pool = new Pool({ connectionString: cs, max: 5 });
  }
  return _pool;
}

/**
 * Aplica as migrations pendentes (em ordem, cada uma em sua transação) e registra
 * em `schema_migrations`. Idempotente e seguro p/ rodar a cada boot. Um advisory
 * lock serializa execuções concorrentes (MCP + painel subindo juntos).
 */
export async function migrate(): Promise<void> {
  const client = await pool().connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    const done = await client.query<{ id: string }>("SELECT id FROM schema_migrations");
    const applied = new Set(done.rows.map((r) => r.id));

    for (const m of migrations) {
      if (applied.has(m.id)) continue;
      try {
        await client.query("BEGIN");
        await client.query(m.sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${m.id} falhou: ${(e as Error).message}`);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK]).catch(() => {});
    client.release();
  }
}

/** @deprecated Use migrate(). Mantido p/ compatibilidade dos consumidores (boot). */
export async function ensureSchema(): Promise<void> {
  await migrate();
}

// ── Membership (app unificado) ───────────────────────────────────────────────
/** Logto sub → tenantId (ou null se o usuário ainda não foi vinculado). */
export async function tenantForUser(logtoSub: string): Promise<string | null> {
  const r = await pool().query<{ tenant_id: string }>(
    "SELECT tenant_id FROM tenant_users WHERE logto_sub = $1",
    [logtoSub],
  );
  return r.rows[0]?.tenant_id ?? null;
}

/** Vincula um usuário Logto a um tenant (idempotente). Usado pelo painel/admin. */
export async function linkUser(logtoSub: string, tenantId: string, email = ""): Promise<void> {
  await pool().query(
    `INSERT INTO tenant_users (logto_sub, tenant_id, email) VALUES ($1, $2, $3)
     ON CONFLICT (logto_sub) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, email = EXCLUDED.email`,
    [logtoSub, tenantId, email],
  );
}

// ── Leitura (MCP) ───────────────────────────────────────────────────────────
/** token → tenantId (ou null). Compara pelo HASH; ignora tokens revogados. */
export async function resolveTokenToTenant(token: string): Promise<string | null> {
  const r = await pool().query<{ tenant_id: string }>(
    "SELECT tenant_id FROM mcp_tokens WHERE token_hash = $1 AND revoked_at IS NULL",
    [hashToken(token)],
  );
  return r.rows[0]?.tenant_id ?? null;
}

/** Secrets do tenant, DECIFRADOS, como { key: value } (ex.: nextcloud_url, openai_api_key…). */
export async function getTenantSecrets(tenantId: string): Promise<Record<string, string>> {
  const r = await pool().query<{ key: string; value_enc: string }>(
    "SELECT key, value_enc FROM tenant_secrets WHERE tenant_id = $1",
    [tenantId],
  );
  const out: Record<string, string> = {};
  for (const row of r.rows) {
    try {
      out[row.key] = decrypt(row.value_enc);
    } catch {
      /* dado adulterado / key errada — ignora aquele secret */
    }
  }
  return out;
}

// ── Escrita (painel) ──────────────────────────────────────────────────────────
export async function createTenant(id: string, name = ""): Promise<void> {
  await pool().query(
    "INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
    [id, name],
  );
}

/** Emite um token novo p/ o tenant e devolve o token em CLARO (mostrar 1x). */
export async function issueToken(tenantId: string): Promise<string> {
  const token = generateToken();
  await pool().query("INSERT INTO mcp_tokens (token_hash, tenant_id) VALUES ($1, $2)", [hashToken(token), tenantId]);
  return token;
}

export async function revokeToken(token: string): Promise<void> {
  await pool().query("UPDATE mcp_tokens SET revoked_at = now() WHERE token_hash = $1", [hashToken(token)]);
}

export async function setSecret(tenantId: string, key: string, value: string): Promise<void> {
  await pool().query(
    `INSERT INTO tenant_secrets (tenant_id, key, value_enc) VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, key) DO UPDATE SET value_enc = EXCLUDED.value_enc, updated_at = now()`,
    [tenantId, key, encrypt(value)],
  );
}

export async function listTenants(): Promise<{ id: string; name: string }[]> {
  const r = await pool().query<{ id: string; name: string }>("SELECT id, name FROM tenants ORDER BY created_at");
  return r.rows;
}
