import { editorial } from './editorial'
import { bold } from './bold'
import { narrativa } from './narrativa'
import type { TemplateConfig } from '../schemas/template.schema'
import type { TemplateId } from '../schemas/content.schema'

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  editorial,
  bold,
  narrativa,
}

export function getTemplate(id: TemplateId): TemplateConfig {
  const template = TEMPLATES[id]
  if (!template) throw new Error(`Template não encontrado: ${id}`)
  return template
}

export { editorial, bold, narrativa }
