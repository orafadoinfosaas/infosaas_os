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

export const ACTIVE_COMPANY = process.env.COMPANY_ID ?? 'infosaas'

// Resolve paths relativos à raiz do monorepo (3 níveis acima do app)
const REPO_ROOT = path.resolve(process.cwd(), '../../..')

export const COMPANIES: Record<string, CompanyConfig> = {
  infosaas: {
    id: 'infosaas',
    name: 'Infosaas',
    dnaPath: path.join(REPO_ROOT, 'dna'),
    skillsPath: path.join(REPO_ROOT, 'dna', 'skills'),
    outputPath: path.join(REPO_ROOT, 'marketing', 'conteudo'),
    publish: {
      activepieces_webhook_url: process.env.ACTIVEPIECES_WEBHOOK_URL ?? '',
      activepieces_webhook_secret: process.env.ACTIVEPIECES_WEBHOOK_SECRET,
    },
  },
}

export function getCompanyConfig(): CompanyConfig {
  const config = COMPANIES[ACTIVE_COMPANY]
  if (!config) throw new Error(`Empresa não encontrada: ${ACTIVE_COMPANY}`)
  return config
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
