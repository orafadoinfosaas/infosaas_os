// Migrations versionadas do cofre. REGRAS:
// - Cada item é aplicado UMA vez, em ordem, e registrado em `schema_migrations`.
// - NUNCA edite nem reordene uma migration já aplicada em produção — sempre
//   ACRESCENTE uma nova ao fim, com `id` único e prefixo numérico crescente.
// - O `id` é o que rastreamos; o conteúdo é SQL puro (roda em transação).

export type Migration = { id: string; sql: string };

export const migrations: Migration[] = [
  {
    // Estado inicial = o que o antigo ensureSchema() criava. Tudo IF NOT EXISTS,
    // então em bancos que já existem isto é no-op e só marca como aplicada.
    id: "0001_init",
    sql: `
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
      CREATE TABLE IF NOT EXISTS tenant_users (
        logto_sub text PRIMARY KEY,
        tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  },
];
