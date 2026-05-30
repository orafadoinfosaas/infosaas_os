// Seam de integração com a Composio para publicação no Instagram.
// Degrada com elegância quando COMPOSIO_API_KEY não está configurada — a ação
// real (toolkit/ação de Instagram + IDs dos perfis conectados) é finalizada na
// fase de ajustes com a config do usuário.

const KEY = process.env.COMPOSIO_API_KEY

export type ComposioProfile = { id: string; label: string }

export function isComposioConfigured(): boolean {
  return !!KEY
}

export async function getComposioProfiles(): Promise<{ configured: boolean; profiles: ComposioProfile[] }> {
  if (!KEY) return { configured: false, profiles: [] }
  // TODO (ajustes): listar contas Instagram conectadas via Composio API.
  return { configured: true, profiles: [] }
}

export type ComposioPublishInput = {
  content_type: string
  caption: string
  scheduled_at: string | null
  profile: string | null
  images: { filename: string; dataUrl: string }[]
}

export async function publishToComposio(
  _input: ComposioPublishInput
): Promise<{ configured: boolean; triggered: boolean; note?: string }> {
  if (!KEY) {
    return { configured: false, triggered: false, note: 'COMPOSIO_API_KEY não configurada' }
  }
  // TODO (ajustes): disparar a ação de publish/schedule no Instagram via Composio,
  // usando o perfil selecionado e as imagens renderizadas.
  return { configured: true, triggered: false, note: 'Ação Composio a configurar' }
}
