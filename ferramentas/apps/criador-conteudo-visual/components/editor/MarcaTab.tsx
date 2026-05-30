'use client'

import { Group, Segmented, ColorField, ToggleRow, PositionPicker, fieldInput } from './controls'
import { DEFAULT_BRANDING, type Branding } from '@/lib/schemas/branding.schema'
import type { Content } from '@/lib/schemas/content.schema'

type Props = {
  content: Content
  onChange: (c: Content) => void
}

export function MarcaTab({ content, onChange }: Props) {
  const branding: Branding = content.branding ?? DEFAULT_BRANDING

  const set = (b: Branding) => onChange({ ...content, branding: b } as Content)
  const setLogo = (p: Partial<Branding['logo']>) => set({ ...branding, logo: { ...branding.logo, ...p } })
  const setNum = (p: Partial<Branding['numbering']>) => set({ ...branding, numbering: { ...branding.numbering, ...p } })
  const setHandle = (p: Partial<Branding['handle']>) => set({ ...branding, handle: { ...branding.handle, ...p } })

  return (
    <div className="flex flex-col gap-6">
      {/* Logo */}
      <div className="flex flex-col gap-3">
        <ToggleRow label="Mostrar logo" checked={branding.logo.show} onChange={(v) => setLogo({ show: v })} />
        {branding.logo.show && (
          <>
            <Group label="Variante">
              <Segmented
                value={branding.logo.variant}
                onChange={(v) => setLogo({ variant: v })}
                options={[
                  { value: 'preto', label: 'Preto' },
                  { value: 'branco', label: 'Branco' },
                  { value: 'laranja', label: 'Laranja' },
                ]}
              />
            </Group>
            <Group label="Posição">
              <PositionPicker
                value={branding.logo.position}
                onChange={(position) => setLogo({ position })}
                positions={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              />
            </Group>
          </>
        )}
      </div>

      {/* Numeração */}
      <div className="flex flex-col gap-3">
        <ToggleRow label="Numeração de slides" checked={branding.numbering.show} onChange={(v) => setNum({ show: v })} />
        {branding.numbering.show && (
          <>
            <Group label="Estilo">
              <Segmented
                value={branding.numbering.style}
                onChange={(v) => setNum({ style: v })}
                options={[
                  { value: 'fraction', label: '1/10' },
                  { value: 'index', label: '01' },
                ]}
              />
            </Group>
            <Group label="Posição">
              <PositionPicker
                value={branding.numbering.position}
                onChange={(position) => setNum({ position })}
                positions={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              />
            </Group>
          </>
        )}
      </div>

      {/* Handle */}
      <div className="flex flex-col gap-3">
        <ToggleRow label="Mostrar handle" checked={branding.handle.show} onChange={(v) => setHandle({ show: v })} />
        {branding.handle.show && (
          <>
            <Group label="Nome">
              <input
                className={fieldInput}
                placeholder="@suaempresa"
                value={branding.handle.name}
                onChange={(e) => setHandle({ name: e.target.value })}
              />
            </Group>
            <Group label="Cor">
              <ColorField value={branding.handle.color} onChange={(c) => setHandle({ color: c })} />
            </Group>
          </>
        )}
      </div>
    </div>
  )
}
