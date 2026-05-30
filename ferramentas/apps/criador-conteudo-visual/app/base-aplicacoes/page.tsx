'use client'

import { TEMPLATES } from '@/lib/templates'
import type { TemplateConfig } from '@/lib/schemas/template.schema'

const PHASE_LABEL: Record<string, string> = {
  descoberta: 'Descoberta',
  relacionamento: 'Relacionamento',
  prontidao: 'Prontidão',
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-lg border border-black/10" style={{ background: color }} />
      <span className="text-[10px] text-[#9d9d9d]">{label}</span>
    </div>
  )
}

function BaseCard({ base }: { base: TemplateConfig }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-[#0d0d0d]">{base.label}</h2>
        <p className="mt-0.5 text-sm text-[#8e8e8e]">{base.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {base.best_for.map((p) => (
            <span key={p} className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[11px] text-[#5d5d5d]">
              {PHASE_LABEL[p] ?? p}
            </span>
          ))}
        </div>
      </div>

      {/* Paleta */}
      <div className="flex gap-4">
        <Swatch color={base.palette.background} label="Fundo" />
        <Swatch color={base.palette.text_primary} label="Texto" />
        <Swatch color={base.palette.text_secondary} label="Texto 2" />
        <Swatch color={base.palette.accent} label="Acento" />
      </div>

      {/* Amostra tipográfica */}
      <div
        className="rounded-xl p-5 overflow-hidden"
        style={{ background: base.palette.background }}
      >
        <div
          style={{
            color: base.palette.text_primary,
            fontWeight: base.typography.headline.weight,
            fontSize: 26,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          Estratégia, negócio e tecnologia.
        </div>
        <div style={{ color: base.palette.text_secondary, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
          Corpo de exemplo aplicando a tipografia desta base.
        </div>
      </div>
    </div>
  )
}

export default function BaseAplicacoesPage() {
  const bases = Object.values(TEMPLATES)
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="text-2xl font-semibold text-[#0d0d0d]">Base de Aplicações</h1>
        <p className="mt-1 mb-6 text-sm text-[#8e8e8e]">
          Como a identidade se aplica em cada base. A edição das bases entra na fase de ajustes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bases.map((b) => (
            <BaseCard key={b.template_id} base={b} />
          ))}
        </div>
      </div>
    </div>
  )
}
