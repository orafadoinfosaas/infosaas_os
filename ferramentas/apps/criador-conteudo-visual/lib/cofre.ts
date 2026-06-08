import {
  ensureSchema,
  createTenant,
  getTenantSecrets,
  setSecret as cofreSetSecret,
  issueToken as cofreIssueToken,
} from '@infosaas/cofre'

// Wrapper do cofre p/ o app (server-only — importar só em server components/actions).
// O cofre só está ativo com DATABASE_URL setado; sem ele, a seção mostra "não configurado".

export function cofreEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

// ensureSchema uma vez por processo (idempotente, mas evita rodar a cada request).
let _schema: Promise<void> | null = null
function ensureSchemaOnce(): Promise<void> {
  if (!_schema) _schema = ensureSchema()
  return _schema
}

/** Garante schema + a linha do tenant (FK das demais tabelas). */
export async function ensureTenantReady(tenantId: string, name = ''): Promise<void> {
  await ensureSchemaOnce()
  await createTenant(tenantId, name)
}

/** Quais chaves de secret estão setadas (NÃO retorna valores — só presença). */
export async function secretsPresent(tenantId: string): Promise<Set<string>> {
  try {
    const secrets = await getTenantSecrets(tenantId)
    return new Set(Object.keys(secrets))
  } catch {
    return new Set()
  }
}

export async function setSecret(tenantId: string, key: string, value: string): Promise<void> {
  await ensureTenantReady(tenantId)
  await cofreSetSecret(tenantId, key, value)
}

export async function issueMcpToken(tenantId: string): Promise<string> {
  await ensureTenantReady(tenantId)
  return cofreIssueToken(tenantId)
}
