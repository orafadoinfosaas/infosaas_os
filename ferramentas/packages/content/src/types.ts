// Vocabulário de geração. FunnelPhase/TemplateId são DERIVADOS dos schemas (fonte
// única) — aqui só compomos os tipos que a montagem do prompt usa.
import type { FunnelPhase, TemplateId } from './schemas/content.schema.js'

export type ContentType = 'carrossel' | 'post' | 'anuncio'

export type SystemPromptOptions = {
  funnelPhase: FunnelPhase
  contentType: ContentType
  template: TemplateId
  /** produto em destaque (anúncio / prontidão) */
  productId?: string
}

export type DNAFiles = {
  voz: string
  design: string
  empresa: string
  posicionamento: string
  icp: string
  product: string
  funnelSkill: string
}
