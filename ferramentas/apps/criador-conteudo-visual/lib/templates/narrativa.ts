import type { TemplateConfig } from '../schemas/template.schema'

export const narrativa: TemplateConfig = {
  template_id: 'narrativa',
  label: 'Narrativa',
  description: 'Stories, cases, bastidores. Imagem como elemento central.',
  best_for: ['relacionamento', 'descoberta'],
  palette: {
    background: '#000000',
    text_primary: '#F5F5F5',
    text_secondary: '#D9D9D9',
    accent: '#FF3D00',
    overlay_default: '#000000',
  },
  typography: {
    font_family: 'Sora',
    headline: { size: 48, weight: 700, letter_spacing: '-0.02em', line_height: 1.2 },
    subheadline: { size: 28, weight: 400, letter_spacing: '0em' },
    body: { size: 22, weight: 400, line_height: 1.6 },
    caption: { size: 16, weight: 400, opacity: 0.7 },
  },
  slide_layouts: {
    cover: {
      image: 'full-bleed-background',
      overlay_opacity: 0.45,
      text_position: 'bottom-left',
      padding: 56,
    },
    content: {
      image: 'full-bleed-background',
      overlay_opacity: 0.6,
      text_position: 'bottom',
      padding: 48,
    },
    closing: {
      image: 'full-bleed-background',
      overlay_opacity: 0.65,
      text_position: 'center',
      padding: 56,
    },
  },
  logo: {
    show_on: ['cover', 'closing'],
    variant: 'branco',
    position: 'top-left',
    size: 40,
  },
}
