import { Pool } from "pg";
import { hashToken, generateToken } from "./tokens.js";
import { encrypt, decrypt } from "./crypto.js";

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

/** Cria as tabelas se não existirem (idempotente). Chamar no boot do consumidor. */
export async function ensureSchema(): Promise<void> {
  await pool().query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id text PRIMARY KEY,
      name text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS mcp_tokens (
      token_hash text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      revoked_at timestamptz
    );
    CREATE TABLE IF NOT EXISTS tenant_secrets (
      tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      key text NOT NULL,
      value_enc text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_id, key)
    );
  `);
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
