'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export type PillOption = { value: string; label: string }

type Props = {
  label: string
  options: PillOption[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function PillSelect({ label, options, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full px-3 h-8 text-[13px] whitespace-nowrap transition-colors disabled:opacity-50 ${
          selected
            ? 'bg-black/[0.06] text-[#0d0d0d]'
            : 'text-[#5d5d5d] hover:bg-black/5'
        }`}
      >
        <span className="truncate max-w-[150px]">{selected ? selected.label : label}</span>
        <ChevronDown size={14} className="flex-none opacity-60" />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-2 min-w-[190px] rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-1.5">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 h-9 text-sm text-[#0d0d0d] hover:bg-black/5"
            >
              <span>{o.label}</span>
              {value === o.value && <Check size={15} className="text-[#0d0d0d]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
