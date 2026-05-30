import type { FunnelPhase, TemplateId } from '../schemas/content.schema'

export type { FunnelPhase }

export type ContentType = 'carrossel' | 'post' | 'anuncio'

export type SystemPromptOptions = {
  funnelPhase: FunnelPhase
  contentType: ContentType
  template: TemplateId
  productId?: string // produto em destaque (anúncio / prontidão)
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
