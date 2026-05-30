export type FlowStep =
  | 'INIT'
  | 'TYPE_SELECTED'
  | 'PHASE_SELECTED'
  | 'TEMPLATE_SELECTED'
  | 'BRIEF_RECEIVED'
  | 'GENERATING'
  | 'PREVIEW'
  | 'APPROVED'
  | 'SAVED'

export type ContentType = 'carrossel' | 'post' | 'anuncio'
export type FunnelPhase = 'descoberta' | 'relacionamento' | 'prontidao'
export type TemplateId = 'editorial' | 'bold' | 'narrativa'

export type FlowState = {
  step: FlowStep
  contentType?: ContentType
  funnelPhase?: FunnelPhase
  templateId?: TemplateId
  productId?: string
  author?: string // voz/identidade: 'infosaas' | 'flg'
  brief?: string
  slug?: string
  uploadedImages?: string[]
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  carrossel: 'Carrossel',
  post: 'Post',
  anuncio: 'Anúncio',
}

export const PHASE_LABELS: Record<FunnelPhase, string> = {
  descoberta: 'Descoberta',
  relacionamento: 'Relacionamento',
  prontidao: 'Prontidão',
}

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  editorial: 'Editorial',
  bold: 'Bold',
  narrativa: 'Narrativa',
}
