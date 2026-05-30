import type { TemplateConfig } from '../schemas/template.schema'

export const bold: TemplateConfig = {
  template_id: 'bold',
  label: 'Bold',
  description: 'Lançamentos, chamadas de alto impacto. Cores fortes, contraste máximo.',
  best_for: ['prontidao'],
  palette: {
    background: '#000000',
    text_primary: '#F5F5F5',
    text_secondary: '#D9D9D9',
    accent: '#FF3D00',
    overlay_default: '#FF3D00',
  },
  typography: {
    font_family: 'Sora',
    headline: { size: 72, weight: 800, letter_spacing: '-0.03em', line_height: 1.0 },
    subheadline: { size: 36, weight: 700, letter_spacing: '-0.02em' },
    body: { size: 22, weight: 400, line_height: 1.5 },
    cta: { size: 22, weight: 800, transform: 'uppercase' },
  },
  slide_layouts: {
    cover: {
      image: 'full-bleed-background',
      overlay_opacity: 0.7,
      text_position: 'center',
      padding: 64,
    },
    content: {
      image: 'none',
      text_position: 'center',
      padding: 64,
      background: '#000000',
      accent_block: true,
    },
    closing: {
      image: 'full-bleed-background',
      overlay_opacity: 0.75,
      text_position: 'center',
      padding: 64,
      cta_button: true,
    },
  },
  logo: {
    show_on: ['cover', 'closing'],
    variant: 'branco',
    position: 'top-right',
    size: 48,
  },
}
