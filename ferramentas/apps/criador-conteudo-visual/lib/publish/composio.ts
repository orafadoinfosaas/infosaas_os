// Integração com a Composio para publicação no Instagram.
// Vídeo/Reel: fluxo de 2 passos da Graph API (validado) — cria o container a
// partir de uma URL pública (R2) e publica, com polling interno até FINISHED.
// Degrada com elegância quando COMPOSIO_API_KEY não está configurada.

const KEY = process.env.COMPOSIO_API_KEY
const BASE = process.env.COMPOSIO_BASE_URL ?? 'https://backend.composio.dev/api/v3'

export type ComposioProfile = { id: string; label: string; entity_id: string }

export function isComposioConfigured(): boolean {
  return !!KEY
}

type ExecResult = { successful?: boolean; data?: Record<string, unknown>; error?: string | null }

// Executa uma tool da Composio na conta conectada indicada.
// entity_id = user_id da conta (ex.: "perfil-infosaas") — obrigatório na v3.
async function execTool(
  action: string,
  connectedAccountId: string | null,
  entityId: string | null,
  args: Record<string, unknown>
): Promise<ExecResult> {
  const res = await fetch(`${BASE}/tools/execute/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY as string },
    body: JSON.stringify({
      connected_account_id: connectedAccountId ?? undefined,
      entity_id: entityId ?? undefined,
      arguments: args,
    }),
  })
  return (await res.json().catch(() => ({}))) as ExecResult
}

type ConnectedAccount = {
  id: string
  user_id?: string
  word_id?: string
  status?: string
}

export async function getComposioProfiles(): Promise<{ configured: boolean; profiles: ComposioProfile[] }> {
  if (!KEY) return { configured: false, profiles: [] }
  try {
    const res = await fetch(`${BASE}/connected_accounts?toolkit_slugs=instagram&statuses=ACTIVE`, {
      headers: { 'x-api-key': KEY },
    })
    const json = (await res.json().catch(() => ({}))) as { items?: ConnectedAccount[] }
    const items = (json.items ?? []).filter((a) => a.status === 'ACTIVE')
    const profiles = items.map((a) => ({
      id: a.id,
      label: a.user_id || a.word_id || a.id,
      entity_id: a.user_id || a.word_id || a.id,
    }))
    return { configured: true, profiles }
  } catch {
    return { configured: true, profiles: [] }
  }
}

export type ComposioPublishInput = {
  content_type: string
  caption: string
  scheduled_at: string | null
  profile: string | null    // connected_account_id (ex.: "ca_66AGbtcRQZ1J")
  entity_id?: string | null // user_id da conta conectada (ex.: "perfil-infosaas")
  images?: { filename: string; dataUrl: string }[]
  video_url?: string
}

export async function publishToComposio(
  input: ComposioPublishInput
): Promise<{ configured: boolean; triggered: boolean; note?: string }> {
  if (!KEY) {
    return { configured: false, triggered: false, note: 'COMPOSIO_API_KEY não configurada' }
  }

  if (input.scheduled_at) {
    return { configured: true, triggered: false, note: 'Agendado — disparo automático ainda não implementado (Fase 1)' }
  }

  if (input.content_type === 'video') {
    if (!input.video_url) return { configured: true, triggered: false, note: 'video_url ausente (upload R2 falhou?)' }
    if (!input.profile) return { configured: true, triggered: false, note: 'Selecione um perfil do Instagram' }

    const entityId = input.entity_id ?? null

    // 1. Resolve o IG User ID (Business) da conta conectada.
    const info = await execTool('INSTAGRAM_GET_USER_INFO', input.profile, entityId, {})
    const igUserId = info.data?.id as string | undefined
    if (!igUserId) {
      return { configured: true, triggered: false, note: `Falha ao obter IG User ID: ${JSON.stringify(info.error ?? info.data)}` }
    }

    // 2. Cria o container do Reel a partir da URL pública (R2).
    const created = await execTool('INSTAGRAM_CREATE_MEDIA_CONTAINER', input.profile, entityId, {
      ig_user_id: igUserId,
      media_type: 'REELS',
      video_url: input.video_url,
      caption: input.caption,
    })
    const creationId = created.data?.id as string | undefined
    if (!creationId) {
      return { configured: true, triggered: false, note: `Falha ao criar container: ${JSON.stringify(created)}` }
    }

    // 3. Polling até FINISHED (máx ~120s, intervalo 5s).
    let finished = false
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000))
      const status = await execTool('INSTAGRAM_GET_POST_STATUS', input.profile, entityId, { creation_id: creationId })
      const code = status.data?.status_code ?? status.data?.status
      if (code === 'FINISHED') { finished = true; break }
      if (code === 'ERROR') {
        return { configured: true, triggered: false, note: `IG recusou o vídeo (container ERROR)` }
      }
    }
    if (!finished) {
      return { configured: true, triggered: false, note: 'Timeout aguardando processamento do IG (>120s)' }
    }

    // 4. Publica.
    const published = await execTool('INSTAGRAM_CREATE_POST', input.profile, entityId, {
      ig_user_id: igUserId,
      creation_id: creationId,
    })
    const mediaId = published.data?.id as string | undefined
    if (published.successful === false || !mediaId) {
      return { configured: true, triggered: false, note: `Falha ao publicar: ${JSON.stringify(published.error ?? published.data)}` }
    }
    return { configured: true, triggered: true, note: `Reel publicado (id ${mediaId})` }
  }

  return { configured: true, triggered: false, note: 'Publicação de imagem ainda não configurada' }
}
