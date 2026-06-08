import { editorial } from './editorial.js'
import { bold } from './bold.js'
import { narrativa } from './narrativa.js'
import type { TemplateConfig } from '../schemas/template.schema.js'
import type { TemplateId } from '../schemas/content.schema.js'

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
