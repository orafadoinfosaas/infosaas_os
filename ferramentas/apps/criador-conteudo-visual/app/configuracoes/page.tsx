import { LogOut } from 'lucide-react'
import { requireSession } from '@/lib/auth/dal'
import { cofreEnabled, secretsPresent } from '@/lib/cofre'
import { SecretsForm, TokenIssuer } from './Forms'

// Sessão + cofre = sempre em request time (lê cookie + DB).
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const session = await requireSession()
  const enabled = cofreEnabled()
  const present = enabled ? [...(await secretsPresent(session.tenantId))] : []

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Cabeçalho + conta */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0d0d0d]">Configurações</h1>
            <p className="text-sm text-[#5d5d5d] mt-1">
              Conta: <span className="text-[#0d0d0d]">{session.email || session.name || session.sub}</span> · workspace:{' '}
              <span className="text-[#0d0d0d]">{session.tenantId}</span>
            </p>
          </div>
          <a
            href="/sign-out"
            className="flex-none inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 h-9 text-sm text-[#3d3d3d] hover:bg-black/5"
          >
            <LogOut size={15} /> Sair
          </a>
        </header>

        {!enabled && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            O cofre ainda não está configurado neste ambiente. Defina <code>DATABASE_URL</code> e <code>COFRE_KEY</code>{' '}
            nas variáveis do serviço para habilitar credenciais e emissão de token.
          </div>
        )}

        {/* Conexão MCP */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0d0d0d]">Conectar no chat (MCP)</h2>
            <p className="text-sm text-[#5d5d5d] mt-1">
              Emita um token para usar o Infosaas OS dentro do Claude ou do ChatGPT — criar e editar conteúdo com o seu
              DNA, direto no chat.
            </p>
          </div>
          <TokenIssuer />
        </section>

        {/* Credenciais (cofre) */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0d0d0d]">Credenciais</h2>
            <p className="text-sm text-[#5d5d5d] mt-1">
              Guardadas cifradas no cofre. Os valores nunca são exibidos de volta — só a indicação de que estão salvos.
            </p>
          </div>
          {enabled ? (
            <SecretsForm present={present} />
          ) : (
            <p className="text-sm text-[#9d9d9d]">Indisponível até o cofre ser configurado.</p>
          )}
        </section>
      </div>
    </div>
  )
}
