import path from 'path'

export type CompanyConfig = {
  id: string
  name: string
  dnaPath: string
  skillsPath: string
  outputPath: string
  publish?: {
    activepieces_webhook_url: string
    activepieces_webhook_secret?: string
  }
}

// Tenant ativo. (Single-tenant por env por ora; o por-request via sessão é o próximo
// passo do multi-tenant.) Aceita TENANT_ID ou COMPANY_ID (legado).
export const ACTIVE_COMPANY = process.env.TENANT_ID ?? process.env.COMPANY_ID ?? 'infosaas'

// Raiz — MESMA lógica do MCP (ferramentas/mcps/server/src/fs/paths.ts): em produção
// CLIENTS_ROOT/<tenant> (volume compartilhado), em dev a raiz do repo. Isso garante que
// o app e o MCP leiam/escrevam o conteúdo no MESMO lugar → o que o chat cria aparece e
// é editável no editor, e vice-versa.
const CLIENTS_ROOT = process.env.CLIENTS_ROOT?.trim()
const REPO_ROOT = process.env.REPO_ROOT?.trim() || path.resolve(process.cwd(), '../../..')

function tenantRoot(tenant: string): string {
  return CLIENTS_ROOT ? path.resolve(CLIENTS_ROOT, tenant) : REPO_ROOT
}

const COMPANY_NAMES: Record<string, string> = { infosaas: 'Infosaas' }

export function getCompanyConfig(): CompanyConfig {
  const tenant = ACTIVE_COMPANY
  const root = tenantRoot(tenant)
  return {
    id: tenant,
    name: COMPANY_NAMES[tenant] ?? tenant,
    // DNA (cérebro, read-only) vem da imagem; o output é a zona compartilhada com o MCP.
    dnaPath: path.join(REPO_ROOT, 'dna'),
    skillsPath: path.join(REPO_ROOT, 'dna', 'skills'),
    outputPath: path.join(root, 'output'), // ← MESMO `tenantRoot/output` que o MCP usa
    publish: {
      activepieces_webhook_url: process.env.ACTIVEPIECES_WEBHOOK_URL ?? '',
      activepieces_webhook_secret: process.env.ACTIVEPIECES_WEBHOOK_SECRET,
    },
  }
}

export function getOutputPath(): string {
  return getCompanyConfig().outputPath
}

export function getDnaPath(): string {
  return getCompanyConfig().dnaPath
}

export function getSkillsPath(): string {
  return getCompanyConfig().skillsPath
}
