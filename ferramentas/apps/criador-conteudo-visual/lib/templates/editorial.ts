import type { TemplateConfig } from '../schemas/template.schema'

export const editorial: TemplateConfig = {
  template_id: 'editorial',
  label: 'Editorial',
  description: 'Conteúdo de valor, insights. Tipografia protagonista, muito respiro.',
  best_for: ['descoberta', 'relacionamento'],
  palette: {
    background: '#F5F5F5',
    text_primary: '#000000',
    text_secondary: '#555555',
    accent: '#FF3D00',
    overlay_default: '#000000',
  },
  typography: {
    font_family: 'Sora',
    headline: { size: 64, weight: 800, letter_spacing: '-0.02em', line_height: 1.1 },
    subheadline: { size: 32, weight: 700, letter_spacing: '-0.01em' },
    body: { size: 24, weight: 400, line_height: 1.55 },
    cta: { size: 20, weight: 700 },
  },
  slide_layouts: {
    cover: {
      image: 'full-bleed-background',
      overlay_opacity: 0.55,
      text_position: 'bottom-left',
      padding: 64,
    },
    content: {
      image: 'none',
      text_position: 'center',
      padding: 72,
      background: '#F5F5F5',
    },
    closing: {
      image: 'full-bleed-background',
      overlay_opacity: 0.6,
      text_position: 'center',
      padding: 64,
    },
  },
  logo: {
    show_on: ['cover', 'closing'],
    variant: 'branco',
    position: 'top-right',
    size: 48,
  },
}
