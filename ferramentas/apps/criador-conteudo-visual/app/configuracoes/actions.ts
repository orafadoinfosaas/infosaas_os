'use server'

import { requireSession } from '@/lib/auth/dal'
import { cofreEnabled, setSecret, issueMcpToken } from '@/lib/cofre'

// Server Actions da seção. Cada uma re-verifica a sessão (não confie no client).

export type SaveState = { ok?: boolean; error?: string }

export async function saveSecretAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireSession()
  if (!cofreEnabled()) return { error: 'Cofre não configurado (defina DATABASE_URL + COFRE_KEY).' }

  const key = String(formData.get('key') ?? '').trim()
  const value = String(formData.get('value') ?? '')
  if (!key) return { error: 'Campo inválido.' }
  if (!value.trim()) return { error: 'Valor vazio.' }

  try {
    await setSecret(session.tenantId, key, value.trim())
    return { ok: true }
  } catch (err) {
    console.error('[configuracoes] saveSecret:', err)
    return { error: 'Falha ao salvar no cofre.' }
  }
}

export type TokenState = { token?: string; error?: string }

export async function issueTokenAction(_prev: TokenState, _formData: FormData): Promise<TokenState> {
  const session = await requireSession()
  if (!cofreEnabled()) return { error: 'Cofre não configurado (defina DATABASE_URL + COFRE_KEY).' }

  try {
    const token = await issueMcpToken(session.tenantId)
    return { token }
  } catch (err) {
    console.error('[configuracoes] issueToken:', err)
    return { error: 'Falha ao emitir token.' }
  }
}
