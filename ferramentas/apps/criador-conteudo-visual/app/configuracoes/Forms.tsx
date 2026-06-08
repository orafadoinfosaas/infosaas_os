'use client'

import { useActionState, useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { SECRET_FIELDS } from '@/lib/cofre-fields'
import { saveSecretAction, issueTokenAction, type SaveState, type TokenState } from './actions'

const INITIAL_SAVE: SaveState = {}
const INITIAL_TOKEN: TokenState = {}

const inputCls =
  'flex-1 min-w-0 rounded-lg border border-black/10 bg-white px-3 h-10 text-sm outline-none focus:border-black/30'
const btnCls =
  'flex-none inline-flex items-center gap-1.5 rounded-lg bg-[#0d0d0d] px-3.5 h-10 text-sm font-medium text-white hover:bg-black disabled:opacity-50'

function SecretField({ field, present }: { field: (typeof SECRET_FIELDS)[number]; present: boolean }) {
  const [state, action, pending] = useActionState(saveSecretAction, INITIAL_SAVE)
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <label className="text-sm text-[#3d3d3d] flex items-center gap-2">
        {field.label}
        {present && (
          <span className="text-[11px] rounded-full bg-green-100 text-green-700 px-1.5 py-0.5">configurado</span>
        )}
      </label>
      <div className="flex gap-2">
        <input type="hidden" name="key" value={field.key} />
        <input
          name="value"
          type={field.type}
          autoComplete="off"
          placeholder={present ? '•••• (já salvo — preencha p/ trocar)' : field.placeholder}
          className={inputCls}
        />
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : state.ok ? <Check size={15} /> : null}
          {state.ok ? 'Salvo' : 'Salvar'}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  )
}

export function SecretsForm({ present }: { present: string[] }) {
  const set = new Set(present)
  return (
    <div className="flex flex-col gap-4">
      {SECRET_FIELDS.map((f) => (
        <SecretField key={f.key} field={f} present={set.has(f.key)} />
      ))}
    </div>
  )
}

export function TokenIssuer() {
  const [state, action, pending] = useActionState(issueTokenAction, INITIAL_TOKEN)
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <form action={action}>
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : null}
          {pending ? 'Emitindo…' : 'Emitir token MCP'}
        </button>
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.token && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col gap-3">
          <p className="text-sm text-amber-900 font-medium">
            ⚠ Copie agora — o token não será mostrado de novo.
          </p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 min-w-0 break-all rounded-lg bg-white border border-black/10 px-3 py-2 text-xs">
              {state.token}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(state.token ?? '')
                setCopied(true)
              }}
              className={btnCls}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="text-xs text-[#3d3d3d] flex flex-col gap-1">
            <p className="font-medium text-[#0d0d0d]">Como conectar no Claude / ChatGPT:</p>
            <p>
              URL: <code className="bg-white border border-black/10 rounded px-1">https://mcp.infosaas.ai/mcp</code>{' '}
              · Header: <code className="bg-white border border-black/10 rounded px-1">Authorization: Bearer SEU_TOKEN</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
