# Criador de Conteúdo Visual — Plano de Implementação

## Contexto

App local para criar conteúdo visual para Instagram (post estático, carrossel, anúncio).
Opera em dois modos:
- **IDE + LLM**: a LLM cria o conteúdo, salva em `marketing/conteudo/`, e o app renderiza o resultado
- **Navegador**: interface conversacional com preview em tempo real

Toda criação é abastecida pelo DNA da empresa (`dna/`) e pela estratégia de comunicação (`.claude/skills/comunicacao-funil/`).

---

## Parte 1 — Schemas JSON

O JSON é a fonte de verdade. Ambos os modos produzem e leem o mesmo formato.

### 1.1 Company Config (replicação)

```json
{
  "company_id": "infosaas",
  "name": "Infosaas",
  "dna_path": "../../../dna",
  "skills_path": "../../../.claude/skills/comunicacao-funil",
  "output_path": "../../../marketing/conteudo"
}
```

> Para replicar para outra empresa: novo `dna/` com a mesma estrutura de pastas, novo `company_id`. O app não muda.

---

### 1.2 Schema — Carrossel Instagram

**Arquivo:** `marketing/conteudo/instagram/carroseis/YYYY-MM-DD_slug/content.json`

```json
{
  "id": "uuid-v4",
  "created_at": "2026-05-26T14:00:00Z",
  "created_by": "ide | browser",
  "company_id": "infosaas",
  "platform": "instagram",
  "content_type": "carrossel",
  "format": { "width": 1080, "height": 1440 },
  "funnel_phase": "descoberta | relacionamento | prontidao",
  "template_id": "editorial | bold | narrativa",
  "topic": "Erros mais comuns em gestão de equipe de tecnologia",
  "caption_file": "caption.md",
  "slides": [
    {
      "index": 1,
      "type": "cover",
      "layout": "image-full-overlay",
      "headline": "Texto principal do cover",
      "subheadline": "",
      "body": "",
      "image": {
        "filename": "assets/slide-01.jpg",
        "position": "background",
        "overlay": { "color": "#000000", "opacity": 0.55 }
      },
      "cta": null
    },
    {
      "index": 2,
      "type": "content",
      "layout": "text-centered",
      "headline": "Erro #1",
      "subheadline": "Contratar sem processo",
      "body": "Corpo do slide com explicação...",
      "image": null,
      "cta": null
    },
    {
      "index": 10,
      "type": "closing",
      "layout": "image-full-overlay",
      "headline": "Texto de fechamento",
      "subheadline": "",
      "body": "",
      "image": {
        "filename": "assets/slide-10.jpg",
        "position": "background",
        "overlay": { "color": "#FF3D00", "opacity": 0.75 }
      },
      "cta": {
        "text": "Me conta nos comentários",
        "type": "engagement | link | none"
      }
    }
  ]
}
```

**Regras de slides:**
- `index: 1` → `type: cover`, sempre `layout: image-full-overlay`, imagem obrigatória
- `index: 2–9` → `type: content`, narrativa construída pela LLM segundo o funil
- `index: 10` → `type: closing`, sempre `layout: image-full-overlay`, imagem obrigatória, CTA opcional

---

### 1.3 Schema — Post Estático Instagram

**Arquivo:** `marketing/conteudo/instagram/posts/YYYY-MM-DD_slug/content.json`

```json
{
  "id": "uuid-v4",
  "created_at": "2026-05-26T14:00:00Z",
  "created_by": "ide | browser",
  "company_id": "infosaas",
  "platform": "instagram",
  "content_type": "post",
  "format": { "width": 1080, "height": 1080 },
  "funnel_phase": "descoberta | relacionamento | prontidao",
  "template_id": "editorial | bold | narrativa",
  "topic": "string",
  "headline": "Texto principal do post",
  "subheadline": "",
  "body": "Corpo do post se houver",
  "image": {
    "filename": "assets/image.jpg",
    "position": "background | top | bottom | side",
    "overlay": { "color": "#000000", "opacity": 0.4 }
  },
  "caption_file": "caption.md"
}
```

---

### 1.4 Schema — Anúncio Instagram

**Arquivo:** `marketing/conteudo/instagram/anuncios/YYYY-MM-DD_slug/content.json`

```json
{
  "id": "uuid-v4",
  "created_at": "2026-05-26T14:00:00Z",
  "created_by": "ide | browser",
  "company_id": "infosaas",
  "platform": "instagram",
  "content_type": "anuncio",
  "format": { "width": 1080, "height": 1080 },
  "funnel_phase": "prontidao",
  "template_id": "bold",
  "topic": "string",
  "headlines": [
    "Título curto 01 — máx 70 caracteres",
    "Título curto 02 — máx 70 caracteres",
    "Título curto 03 — máx 70 caracteres"
  ],
  "body": "Texto principal do criativo",
  "image": {
    "filename": "assets/image.jpg",
    "position": "background",
    "overlay": { "color": "#000000", "opacity": 0.5 }
  },
  "caption_file": "caption.md"
}
```

---

### 1.5 Schema — Templates

Cada template é um config JSON pré-definido que o renderer aplica ao `content.json`.

#### Template: Editorial

```json
{
  "template_id": "editorial",
  "label": "Editorial",
  "description": "Conteúdo de valor, educação, insights. Tipografia protagonista, muito respiro.",
  "best_for": ["descoberta", "relacionamento"],
  "palette": {
    "background": "#F5F5F5",
    "text_primary": "#000000",
    "text_secondary": "#555555",
    "accent": "#FF3D00",
    "overlay_default": "#000000"
  },
  "typography": {
    "font_family": "Sora",
    "headline": { "size": 64, "weight": 800, "letter_spacing": "-0.02em", "line_height": 1.1 },
    "subheadline": { "size": 32, "weight": 700, "letter_spacing": "-0.01em" },
    "body": { "size": 24, "weight": 400, "line_height": 1.55 },
    "cta": { "size": 20, "weight": 700 }
  },
  "slide_layouts": {
    "cover": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.55,
      "text_position": "bottom-left",
      "padding": 64
    },
    "content": {
      "image": "none | small-top-right",
      "background": "palette.background",
      "text_position": "center",
      "padding": 72
    },
    "closing": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.6,
      "text_position": "center",
      "padding": 64
    }
  },
  "logo": {
    "show_on": ["cover", "closing"],
    "variant": "branco",
    "position": "top-right",
    "size": 48
  }
}
```

#### Template: Bold

```json
{
  "template_id": "bold",
  "label": "Bold",
  "description": "Lançamentos, promoções, chamadas de alto impacto. Cores fortes, contraste máximo.",
  "best_for": ["prontidao"],
  "palette": {
    "background": "#000000",
    "text_primary": "#F5F5F5",
    "text_secondary": "#D9D9D9",
    "accent": "#FF3D00",
    "overlay_default": "#FF3D00"
  },
  "typography": {
    "font_family": "Sora",
    "headline": { "size": 72, "weight": 800, "letter_spacing": "-0.03em", "line_height": 1.0 },
    "subheadline": { "size": 36, "weight": 700, "letter_spacing": "-0.02em" },
    "body": { "size": 22, "weight": 400, "line_height": 1.5 },
    "cta": { "size": 22, "weight": 800, "transform": "uppercase" }
  },
  "slide_layouts": {
    "cover": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.7,
      "text_position": "center",
      "padding": 64
    },
    "content": {
      "image": "none",
      "background": "palette.background",
      "accent_block": true,
      "text_position": "center",
      "padding": 64
    },
    "closing": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.75,
      "text_position": "center",
      "cta_button": true,
      "padding": 64
    }
  },
  "logo": {
    "show_on": ["cover", "closing"],
    "variant": "branco",
    "position": "top-right",
    "size": 48
  }
}
```

#### Template: Narrativa

```json
{
  "template_id": "narrativa",
  "label": "Narrativa",
  "description": "Stories, cases, bastidores. Imagem como elemento central, texto como legenda.",
  "best_for": ["relacionamento", "descoberta"],
  "palette": {
    "background": "#000000",
    "text_primary": "#F5F5F5",
    "text_secondary": "#D9D9D9",
    "accent": "#FF3D00",
    "overlay_default": "#000000"
  },
  "typography": {
    "font_family": "Sora",
    "headline": { "size": 48, "weight": 700, "letter_spacing": "-0.02em", "line_height": 1.2 },
    "subheadline": { "size": 28, "weight": 400, "letter_spacing": "0em" },
    "body": { "size": 22, "weight": 400, "line_height": 1.6 },
    "caption": { "size": 16, "weight": 400, "opacity": 0.7 }
  },
  "slide_layouts": {
    "cover": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.45,
      "text_position": "bottom-left",
      "padding": 56
    },
    "content": {
      "image": "top-half | full-bleed-background",
      "overlay_opacity": 0.6,
      "text_position": "bottom",
      "padding": 48
    },
    "closing": {
      "image": "full-bleed-background",
      "overlay_opacity": 0.65,
      "text_position": "center",
      "padding": 56
    }
  },
  "logo": {
    "show_on": ["cover", "closing"],
    "variant": "branco",
    "position": "top-left",
    "size": 40
  }
}
```

---

### 1.6 Estrutura de saída em `marketing/conteudo/`

```
marketing/conteudo/
  instagram/
    carroseis/
      2026-05-26_erros-gestao-equipe/
        content.json
        caption.md
        assets/
          slide-01.jpg
          slide-10.jpg
    posts/
      2026-05-26_slug-do-post/
        content.json
        caption.md
        assets/
          image.jpg
    anuncios/
      2026-05-26_slug-do-anuncio/
        content.json
        caption.md
        assets/
          image.jpg
```

---

## Parte 2 — Projeto Next.js

### 2.1 Stack

| Camada | Lib |
|---|---|
| Framework | Next.js 15 (App Router) |
| Chat UI | assistant-ui |
| LLM | Vercel AI SDK + Claude Sonnet |
| Renderer visual | Konva.js (canvas) |
| Componentes | shadcn/ui + Tailwind |
| Schemas/validação | Zod |
| File watching | chokidar |

---

### 2.2 Estrutura de pastas do projeto

```
ferramentas/apps/criador-conteudo-visual/
  app/
    layout.tsx                     ← fonte Sora, paleta da marca
    page.tsx                       ← split layout: chat esquerda, preview direita
    api/
      chat/
        route.ts                   ← streaming handler (Vercel AI SDK + Claude)
      content/
        save/route.ts              ← grava content.json + caption.md em marketing/
        list/route.ts              ← lista conteúdos salvos
        [id]/route.ts              ← lê conteúdo específico
      dna/
        route.ts                   ← serve contexto DNA compilado para debug
      upload/
        route.ts                   ← recebe imagens e salva em assets/
  components/
    chat/
      ChatPanel.tsx                ← wrapper do assistant-ui
      MessageRenderer.tsx          ← renderiza mensagens customizadas
      TemplateCard.tsx             ← card visual para seleção de template no chat
      PhaseSelector.tsx            ← seletor de fase do funil no chat
      ImageUploadPrompt.tsx        ← prompt de upload dentro do chat
    preview/
      PreviewPanel.tsx             ← painel direito de preview
      CarouselPreview.tsx          ← visualizador com navegação entre slides
      SlideCanvas.tsx              ← renderiza slide individual (Konva)
      PostCanvas.tsx               ← renderiza post estático
      AdCanvas.tsx                 ← renderiza anúncio
      ExportButton.tsx             ← exporta slides como PNG
    shared/
      FormatBadge.tsx              ← exibe dimensões selecionadas
  lib/
    dna/
      loader.ts                    ← lê DNA e compila system prompt
      types.ts                     ← interfaces TypeScript do DNA
    content/
      writer.ts                    ← salva content.json + caption.md
      reader.ts                    ← lê arquivos de marketing/conteudo/
      watcher.ts                   ← detecta arquivos criados pela LLM (chokidar)
      slug.ts                      ← gera slug a partir do tópico
    templates/
      editorial.ts
      bold.ts
      narrativa.ts
      index.ts                     ← registro de templates
    schemas/
      content.schema.ts            ← Zod: schema do content.json
      slide.schema.ts              ← Zod: schema de cada slide
      template.schema.ts           ← Zod: schema de template config
    renderer/
      slide-renderer.ts            ← lógica de renderização (template + content → canvas spec)
      layout-engine.ts             ← calcula posições, tamanhos, overflow de texto
  config/
    company.ts                     ← config da empresa ativa (paths para DNA e output)
  public/
    fonts/
      Sora-Regular.woff2
      Sora-Bold.woff2
      Sora-ExtraBold.woff2
```

---

### 2.3 DNA Loader — o coração do sistema

O DNA Loader compila o contexto da empresa em um system prompt rico que é enviado ao Claude antes de qualquer conversa. Isso garante que todo conteúdo gerado respeite a voz, o posicionamento e a estratégia de funil.

```typescript
// lib/dna/loader.ts

type FunnelPhase = 'descoberta' | 'relacionamento' | 'prontidao'
type ContentType = 'carrossel' | 'post' | 'anuncio'

const PHASE_FILE = {
  descoberta: 'DESCOBERTA.md',
  relacionamento: 'RELACIONAMENTO.md',
  prontidao: 'PRONTIDAO.md',
}

export async function buildSystemPrompt(options: {
  funnelPhase: FunnelPhase
  contentType: ContentType
  template: string
}): Promise<string> {
  const [voz, design, funnelSkill] = await Promise.all([
    readDNAFile('empresa/VOZ.md'),
    readDNAFile('empresa/DESIGN.md'),
    readSkillFile(`comunicacao-funil/${PHASE_FILE[options.funnelPhase]}`),
  ])

  return `
Você é um especialista em criação de conteúdo visual para Instagram.
Crie conteúdo para a fase de ${options.funnelPhase} do funil.
O formato será: ${options.contentType} com template ${options.template}.

## Voz e Tom
${voz}

## Identidade Visual
${design}

## Regras desta fase do funil
${funnelSkill}

## Regras de output
- Responda SOMENTE com o JSON no schema acordado
- O conteúdo de cada slide deve seguir rigorosamente as regras da fase do funil
- A legenda deve seguir as regras de voz da empresa
- Nunca use palavras da lista de palavras proibidas do VOZ.md
  `
}
```

---

### 2.4 Fluxo conversacional — estados

O chat guia o usuário (ou a LLM via IDE) por estados sequenciais:

```
INIT
  └─ "O que vamos criar?"
       ↓
TYPE_SELECTED (carrossel | post | anúncio)
  └─ "Para qual etapa do funil?"
       ↓
PHASE_SELECTED (descoberta | relacionamento | prontidão)
  └─ [mostra 3 cards de template com preview visual]
       ↓
TEMPLATE_SELECTED
  └─ "Qual o tema ou brief do conteúdo?"
       ↓
BRIEF_RECEIVED
  └─ [se contentType precisa de imagem nos slides que não têm texto]
     "Você tem imagens para usar? Faça upload aqui."
       ↓
IMAGES_READY | IMAGES_SKIPPED
  └─ [LLM gera o content.json com DNA context]
       ↓
GENERATING → PREVIEW
  └─ [preview ao vivo, usuário pode pedir ajustes]
       ↓
APPROVED
  └─ [salva em marketing/conteudo/ com slug gerado]
       ↓
SAVED
```

---

### 2.5 Layout da interface

```
┌─────────────────────┬──────────────────────────────┐
│                     │                              │
│   CHAT              │   PREVIEW                    │
│                     │                              │
│  [Histórico de      │  [Slide atual em canvas]     │
│   mensagens]        │                              │
│                     │  ← 1 / 10 →                 │
│  [Cards de          │                              │
│   template]         │  [Thumbnails de slides]      │
│                     │                              │
│  [Upload de         │  [Botão exportar PNG]        │
│   imagens]          │                              │
│                     │                              │
│  [Input do chat]    │                              │
│                     │                              │
└─────────────────────┴──────────────────────────────┘
```

---

### 2.6 File watcher — modo IDE

Quando a LLM cria um `content.json` pela IDE, o app detecta e atualiza o preview automaticamente.

```typescript
// lib/content/watcher.ts
import chokidar from 'chokidar'
import { getOutputPath } from '../config/company'

export function watchContentDirectory(
  onNewContent: (filePath: string) => void
) {
  const watcher = chokidar.watch(
    `${getOutputPath()}/**/content.json`,
    { ignoreInitial: false }
  )

  watcher.on('add', onNewContent)
  watcher.on('change', onNewContent)

  return watcher
}
```

O app expõe um endpoint SSE (`/api/content/watch`) que o frontend assina. Quando um novo arquivo aparece, o preview atualiza sem recarregar a página.

---

### 2.7 Modelo de replicação para outras empresas

A mudança para uma nova empresa é somente no `config/company.ts`:

```typescript
// config/company.ts
export const ACTIVE_COMPANY = process.env.COMPANY_ID ?? 'infosaas'

export const COMPANIES: Record<string, CompanyConfig> = {
  infosaas: {
    id: 'infosaas',
    name: 'Infosaas',
    dnaPath: path.resolve(__dirname, '../../../dna'),
    skillsPath: path.resolve(__dirname, '../../../.claude/skills/comunicacao-funil'),
    outputPath: path.resolve(__dirname, '../../../marketing/conteudo'),
  },
  // nova-empresa: { ... mesmo padrão de pastas dna/ ... }
}

export function getCompanyConfig(): CompanyConfig {
  return COMPANIES[ACTIVE_COMPANY]
}
```

O DNA de cada empresa precisa ter a mesma estrutura de pastas:
```
dna/
  empresa/VOZ.md
  empresa/DESIGN.md
  identidade-visual/
.claude/skills/
  comunicacao-funil/
    DESCOBERTA.md
    RELACIONAMENTO.md
    PRONTIDAO.md
```

---

## Parte 3 — Ordem de implementação

### Fase 1 — Fundação (schemas + config)
1. Criar `lib/schemas/` com schemas Zod para content, slide e template
2. Criar `config/company.ts` com config da Infosaas
3. Criar `lib/templates/` com os 3 templates (editorial, bold, narrativa)
4. Criar `lib/dna/loader.ts` com o DNA Loader

### Fase 2 — Backend local
5. API route `/api/content/save` — grava arquivos em `marketing/conteudo/`
6. API route `/api/upload` — recebe e salva imagens em `assets/`
7. API route `/api/content/watch` — SSE para file watching
8. API route `/api/chat` — streaming com Vercel AI SDK + Claude (com DNA context)

### Fase 3 — Renderer visual
9. `lib/renderer/layout-engine.ts` — calcula layout de cada slide
10. `components/preview/SlideCanvas.tsx` — renderiza slide com Konva
11. `components/preview/CarouselPreview.tsx` — navegação entre slides
12. Testar renderização dos 3 templates

### Fase 4 — Interface do chat
13. Setup do assistant-ui
14. `components/chat/TemplateCard.tsx` — seleção visual de template no chat
15. `components/chat/ImageUploadPrompt.tsx` — upload inline
16. Implementar máquina de estados do fluxo conversacional

### Fase 5 — Integração e polish
17. Layout split-panel (chat + preview)
18. File watcher com atualização automática do preview
19. Exportação de slides como PNG
20. Testar modo IDE: LLM cria conteúdo → preview atualiza automaticamente
