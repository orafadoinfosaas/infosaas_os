'use client'

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  type LucideIcon,
} from 'lucide-react'

// Controles reutilizáveis dos painéis (estilo ChatGPT, campos 10px).

export function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[#5d5d5d]">{label}</span>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-10 flex-none shrink-0 overflow-hidden rounded-full transition-colors ${
        checked ? 'bg-[#0d0d0d]' : 'bg-black/15'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 text-sm text-[#0d0d0d]">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// Seletor visual de posição: um mini-frame com pontos clicáveis nos cantos/bordas.
const POS_CLASS: Record<string, string> = {
  'top-left': 'top-2 left-2',
  'top-center': 'top-2 left-1/2 -translate-x-1/2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-center': 'bottom-2 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-2 right-2',
}

export function PositionPicker<T extends string>({
  value,
  onChange,
  positions,
}: {
  value: T
  onChange: (v: T) => void
  positions: T[]
}) {
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-[10px] border border-black/10 bg-black/[0.03]">
      {positions.map((p) => {
        const active = value === p
        return (
          <button
            key={p}
            type="button"
            aria-label={p}
            aria-pressed={active}
            onClick={() => onChange(p)}
            className={`absolute ${POS_CLASS[p]} grid h-7 w-7 place-items-center rounded-md transition-colors ${
              active ? 'bg-[#0d0d0d]' : 'border border-black/10 bg-white hover:border-black/30'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-sm ${active ? 'bg-white' : 'bg-black/25'}`} />
          </button>
        )
      })}
    </div>
  )
}

type Opt<T extends string> = { value: T; label: string }

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Opt<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center rounded-[10px] bg-black/[0.04] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 h-8 rounded-md text-xs font-medium transition-colors ${
            value === o.value ? 'bg-white text-[#0d0d0d] shadow-sm' : 'text-[#5d5d5d] hover:text-[#0d0d0d]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const HEX = /^#[0-9A-Fa-f]{6}$/

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-black/10 px-2 h-10">
      <input
        type="color"
        value={HEX.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-6 w-6 flex-none rounded cursor-pointer border-0 bg-transparent p-0"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-sm text-[#0d0d0d] outline-none"
      />
    </div>
  )
}

export function RangeField({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[#0d0d0d]"
      />
      <span className="w-10 text-right text-xs text-[#5d5d5d] tabular-nums">
        {format ? format(value) : value}
      </span>
    </div>
  )
}

export const fieldInput =
  'w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#9d9d9d] outline-none focus:border-black/25 transition-colors'

// Segmented genérico baseado em ícones.
function IconChoice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; Icon: LucideIcon; label: string }[]
}) {
  return (
    <div className="flex items-center rounded-[10px] bg-black/[0.04] p-1">
      {options.map(({ value: v, Icon, label }) => (
        <button
          key={v}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => onChange(v)}
          className={`flex-1 grid place-items-center h-8 rounded-md transition-colors ${
            value === v ? 'bg-white text-[#0d0d0d] shadow-sm' : 'text-[#5d5d5d] hover:text-[#0d0d0d]'
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}

// Alinhamento horizontal (esquerda / centro / direita).
export function AlignSegmented({
  value,
  onChange,
}: {
  value: 'left' | 'center' | 'right'
  onChange: (v: 'left' | 'center' | 'right') => void
}) {
  return (
    <IconChoice
      value={value}
      onChange={onChange}
      options={[
        { value: 'left', Icon: AlignLeft, label: 'Esquerda' },
        { value: 'center', Icon: AlignCenter, label: 'Centro' },
        { value: 'right', Icon: AlignRight, label: 'Direita' },
      ]}
    />
  )
}

// Alinhamento vertical (topo / centro / base).
export function VAlignSegmented({
  value,
  onChange,
}: {
  value: 'top' | 'center' | 'bottom'
  onChange: (v: 'top' | 'center' | 'bottom') => void
}) {
  return (
    <IconChoice
      value={value}
      onChange={onChange}
      options={[
        { value: 'top', Icon: AlignStartHorizontal, label: 'Topo' },
        { value: 'center', Icon: AlignCenterHorizontal, label: 'Centro' },
        { value: 'bottom', Icon: AlignEndHorizontal, label: 'Base' },
      ]}
    />
  )
}
