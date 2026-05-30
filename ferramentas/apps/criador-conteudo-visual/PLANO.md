# Criador de Conteúdo Visual — Plano de Implementação (v2)

> Reescrita completa após definição da nova direção de produto. Substitui o plano
> anterior (que era dark/Sora-only, sem stories, com publicação via Activepieces e
> sem o shell de aplicação). Esta v2 segue o **brandbook** como fonte de verdade
> visual e o documento de requisitos `criador-de-conteudo.md`.

## Contexto

App local para criar conteúdo visual para Instagram (e, no futuro, outras plataformas).
Opera em dois modos:
- **IDE + LLM**: a LLM cria/edita o conteúdo em disco e o app renderiza o resultado ao vivo (file watcher).
- **Navegador**: interface conversacional (composer) com preview e edição em tempo real.

Toda criação é abastecida por três fontes:
- **DNA da empresa** — `dna/`
- **Estratégia de comunicação (funil)** — `.claude/skills/comunicacao-funil/`
- **Identidade visual / brandbook** — `dna/identidade-visual/`

---

## Parte 0 — Fundação de marca (não-negociável)

A base visual segue **estritamente** o brandbook (`dna/identidade-visual/colors_and_type.css`
e `dna/empresa/DESIGN.md`). Três correções em relação à base atual:

| Item | Base antiga | Brandbook (alvo) |
|---|---|---|
| Tema | Dark | **Claro** — `--bg` #F5F5F5, texto #000, cards #FFF, único acento #FF3D00 |
| Fonte | (Sora) | **Sora** — mantida por decisão do time (apesar do brandbook ter Gotham nos ativos) |
| Ícones | Emoji/unicode | **Lucide** (stroke 1.5–2px, 24px, `currentColor`) — emoji proibido na UI |

**Tokens** (do `colors_and_type.css`, mapeados para o tema do Tailwind):
- Cores: `--laranja #FF3D00`, `--preto #000`, `--branco-off #F5F5F5`, `--branco #FFF`,
  `--cinza-claro #D9D9D9` + rampa `cinza-100..900`; estados `--laranja-press/hover/soft/deep`.
- Semânticos: `--bg`, `--bg-elev`, `--bg-invert`, `--bg-accent`, `--fg`, `--fg-muted`,
  `--fg-subtle`, `--border`, `--accent` (+ hover/press).
- Type: escala `--fs-display-xl … --fs-caption`, line-heights, tracking `-0.02em`.
- Espaço: base 4px (`--space-1..10`). Densidade de app: grid 16px + micro 8px.
- Radii: `12` inputs/linhas · `18` botões · `24` cards · `32` hero · `999` pills.
- Shadow: `--shadow-sm` inputs · `--shadow` cards · `--shadow-lg` menus/modais · `--shadow-accent` (glow laranja) em hover de CTA.
- Motion: `--ease cubic-bezier(0.2,0.7,0.2,1)`, durações 120/200/320ms. Sem bounce.
- Chrome (do DESIGN.md): **sidebar 240px ↔ 64px**, **top bar 64px**, content padding 16px. Header sticky com hairline 1px + fundo branco.
- Logos: `dna/identidade-visual/assets/logos/` — no claro usar `logo-black.svg`; o **símbolo** como motivo decorativo, nunca como ícone de UI.

**Tarefas:**
1. Migrar `globals.css` para importar os tokens do brandbook e expô-los ao Tailwind (`@theme`).
2. Trocar tema do `layout.tsx` para claro (off-white + texto preto) e remover qualquer resíduo dark.
3. Adicionar `lucide-react`; substituir todos os emojis/unicode por ícones Lucide.
4. Copiar/servir a fonte Sora e os logos (SVG) para `public/`.

---

## Parte 1 — Modelo de dados (schemas)

O JSON é a fonte de verdade. Ambos os modos produzem e leem o mesmo formato.

### 1.1 Company Config (replicação + extensível p/ multi-plataforma)

```jsonc
{
  "company_id": "infosaas",
  "name": "Infosaas",
  "dna_path": "../../../dna",
  "skills_path": "../../../.claude/skills/comunicacao-funil",
  "identity_path": "../../../dna/identidade-visual",
  "output_path": "../../../marketing/conteudo",
  "platforms": ["instagram"]          // hoje só instagram; dimensão pronta p/ evoluir
}
```

### 1.2 Formatos e proporções

| Formato | `content_type` | Proporções permitidas | Dimensões base |
|---|---|---|---|
| Estático | `estatico` | 1:1, 4:5 | 1080×1080 / 1080×1350 |
| Carrossel | `carrossel` | 1:1, 4:5 | 1080×1080 / 1080×1350 |
| Stories | `stories` | 9:16 | 1080×1920 |
| Anúncio | `anuncio` | 1:1, 4:5 *(confirmar)* | 1080×1080 / 1080×1350 |

`format` deixa de ser fixo:

```jsonc
"platform": "instagram",
"format": { "aspect_ratio": "4:5", "width": 1080, "height": 1350 }
```

> O `aspect_ratio` é trocável no editor (top bar) e recalcula o layout (ver Parte 5).

### 1.3 Conteúdo — campos comuns (Base)

```jsonc
{
  "id": "uuid-v4",
  "created_at": "2026-05-28T14:00:00Z",
  "created_by": "ide | browser",
  "company_id": "infosaas",
  "platform": "instagram",
  "content_type": "carrossel | estatico | stories | anuncio",
  "format": { "aspect_ratio": "4:5", "width": 1080, "height": 1350 },
  "funnel_phase": "descoberta | relacionamento | prontidao",
  "base_id": "editorial | bold | narrativa | ...",  // base de aplicação (Parte 1.7)
  "topic": "string",
  "caption_file": "caption.md",
  "branding": { /* Parte 1.4 */ },
  // texto: carrossel → slides[]; estatico/stories/anuncio → campos de frame único
  "slides": [ /* Slide (Parte 1.5) */ ],
  // publicação (Parte 7)
  "publish_status": "draft | scheduled | published",
  "published_at": "2026-05-29T10:00:00Z",
  "scheduled_at": "2026-05-30T09:00:00Z",
  "publish_targets": ["<composio_account_id>"]
}
```

### 1.4 Bloco `branding` (aba Marca)

Aplicação da marca no criativo. Global, com overrides por slide quando fizer sentido.

```jsonc
"branding": {
  "logo": { "show": true, "variant": "preto | branco | laranja", "position": "top-left | top-right" },
  "numbering": { "show": true, "position": "top-right | bottom-right | bottom-center", "style": "1/10 | 01" },
  "handle": {
    "show": true,
    "name": "@infosaas",
    "color": "#000000",
    "avatar": { "show": false, "filename": "assets/avatar.png" }
  },
  "authorial": { "show": false, "text": "" }   // marcação autoral opcional
}
```

### 1.5 Slide / frame + bloco `layout` (painel Layout)

Carrossel usa `slides[]`; estático/stories/anúncio usam um único frame com a mesma estrutura.

```jsonc
{
  "index": 1,
  "type": "cover | content | closing",          // só carrossel usa cover/closing
  "headline": "string",
  "subheadline": "",
  "body": "",
  "headlines": ["", "", ""],                    // só anúncio (3 variações, máx 70)
  "cta": { "text": "", "type": "engagement | link | none", "url": "" },
  "layout": {
    "align": { "vertical": "top|center|bottom", "horizontal": "left|center|right" },
    "media": {
      "kind": "image | video | none",
      "source": "url | upload | ai",
      "ref": "assets/slide-01.jpg",             // filename (upload) ou URL
      "mode": "cover | element",                // cover = fundo; element = bloco junto ao texto
      "fit": "cover | contain",
      "box": { "x": 0, "y": 0, "w": 1080, "h": 600 }  // usado quando mode=element
    },
    "background": {
      "type": "solid | gradient",
      "color": "#F5F5F5",
      "gradient": { "from": "#FF3D00", "to": "#B82C00", "angle": 135 }
    },
    "mask": { "color": "#000000", "opacity": 0.55 }   // overlay sobre a mídia p/ legibilidade
  }
}
```

> **Máscara** (`layout.mask`) substitui o antigo `overlay`: scrim de cor + intensidade
> por cima da mídia, com o texto renderizado acima. Não é drop-shadow.

### 1.6 Thread de conversa (Suas criações — histórico estilo GPT)

Cada criação guarda a conversa completa, para reabrir e continuar.

```jsonc
// thread.json
{
  "creation_id": "uuid-v4",
  "title": "Erros de gestão de equipe",      // derivado do 1º brief
  "created_at": "…", "updated_at": "…",
  "messages": [
    { "role": "user", "content": "…", "ts": "…", "attachments": ["assets/ref.png"] },
    { "role": "assistant", "content": "…", "ts": "…" }
  ]
}
```

### 1.7 Base de Aplicações (templates editáveis)

Generalização dos antigos templates (`editorial`, `bold`, `narrativa`) — agora **editáveis
pelo usuário** e organizados por formato. Cada base define como a identidade se aplica:
paleta, tipografia, layouts por tipo de slide, defaults de marca e de máscara.

```jsonc
// config/bases/<base_id>.json  (editável via tela "Base de Aplicações")
{
  "base_id": "editorial",
  "label": "Editorial",
  "best_for": ["descoberta", "relacionamento"],
  "applies_to": ["estatico", "carrossel", "stories", "anuncio"],
  "palette": { "background": "#F5F5F5", "text_primary": "#000", "text_secondary": "#5C5C5C", "accent": "#FF3D00" },
  "typography": { "font_family": "Sora", "headline": { "size": 64, "weight": 800 }, "body": { "size": 24, "weight": 400 } },
  "slide_layouts": { "cover": { /* … */ }, "content": { /* … */ }, "closing": { /* … */ } },
  "branding_defaults": { /* igual ao bloco branding */ },
  "mask_default": { "color": "#000000", "opacity": 0.55 }
}
```

> Decisão a confirmar na revisão: a base deixou de ser escolhida no composer.
> Default por `funnel_phase` (via `best_for`), trocável no editor.

### 1.8 Estrutura de saída em `marketing/conteudo/`

```
marketing/conteudo/
  instagram/
    carroseis/ 2026-05-28_slug/ { content.json, caption.md, thread.json, thumbnail.png, assets/ }
    estaticos/ 2026-05-28_slug/ { content.json, caption.md, thread.json, thumbnail.png, assets/ }
    stories/   2026-05-28_slug/ { content.json, caption.md, thread.json, thumbnail.png, assets/ }
    anuncios/  2026-05-28_slug/ { content.json, caption.md, thread.json, thumbnail.png, assets/ }
```

---

## Parte 2 — Shell do app

### 2.1 Sidebar (240px ↔ 64px recolhível)

Navegação (ícones Lucide), na ordem do mockup:

| Item | Destino / função |
|---|---|
| Novo conteúdo | Home do composer (`/`) |
| Buscar conteúdo | Busca em criações + histórico |
| DNA | Editor `.md` de `dna/` + `.claude/skills/comunicacao-funil/` |
| Calendário | Agendamentos (visual + edição) |
| Biblioteca | Grid de criações |
| Identidade Visual | Editor `.md` de `dna/identidade-visual/` |
| Base de Aplicações | Editor das bases de aplicação por formato |
| **Suas criações** | Lista de threads recentes (estilo GPT), recolhível |

- Toggle de recolher/expandir ao lado do logo (no editor, entra recolhida = rail de ícones).
- Header sticky: fundo branco + hairline 1px.

### 2.2 Componentes
```
components/layout/
  AppShell.tsx        ← grid: sidebar + área principal
  Sidebar.tsx         ← nav + Suas criações (estado expandido/recolhido)
  SidebarNavItem.tsx  ← ícone Lucide + label
  RecentCreations.tsx ← lista de threads
  TopBar.tsx          ← reutilizado pelo editor (Parte 4.1)
```

---

## Parte 3 — Home de criação (composer)

Substitui o wizard em etapas por um composer único (estilo ChatGPT).

```
            O que quer criar hoje?

  ┌───────────────────────────────────────────────┐
  │ ✎ Descreva o que você quer criar…             │
  │                                                │
  │ [+]  [Plataforma ▾] [Formato ▾] [Comunicação ▾]   ➤ │
  └───────────────────────────────────────────────┘
```

- **Campo de texto:** brief livre com todo o contexto para o agente.
- **Botão "+":** anexar arquivo/imagem (vai para `assets/` + entra no contexto do agente).
- **Seletores:**
  - Plataforma → Instagram (única ativa).
  - Formato → estático / carrossel / stories / anúncio.
  - Tipo de comunicação → descoberta / relacionamento / prontidão (lê `.claude/skills/comunicacao-funil/`).
- Enviar → cria a thread, chama o agente com DNA+funil+base, gera o `content.json`, abre o **Editor**.

```
components/composer/
  Composer.tsx        ← caixa + seletores + anexos + enviar
  PlatformSelect.tsx  PlatformSelect | FormatSelect | CommunicationSelect (pills/dropdown)
  AttachButton.tsx
```

---

## Parte 4 — Editor / Canvas

Layout de 4 zonas: rail (sidebar recolhida) · top bar · painel esquerdo · canvas central · painel direito.

### 4.1 Top bar
- **Indicadores do conteúdo:** plataforma · formato · tipo de comunicação (do que foi escolhido).
- **Seletor de proporção:** opções conforme o formato (estático/carrossel → 1:1, 4:5 · stories → 9:16). Troca recalcula o layout.
- **Ações:**
  - **Exportar** → PNG (todos os frames) ou **PDF** (multipágina).
  - **Agendar** → escolhe perfil (Composio) + data/hora.
  - **Publicar agora** (laranja) → escolhe perfil (Composio) + publica.

### 4.2 Painel esquerdo — abas `Chat | Marca | Texto | Legenda`
- **Chat:** mesma conversa do composer; continuar pedindo ajustes ao agente (atualiza `content.json` + preview).
- **Marca:** edita o bloco `branding` (logo on/off + variante, numeração + posição/estilo, handle: mostrar/@nome/cor/avatar, marcação autoral).
- **Texto:** edita headline/subheadline/body (e `headlines[]` no anúncio) + alinhamento; **sync para `.md` e `.json`** em disco.
- **Legenda:** edita `caption.md`; **sync para `.md` e `.json`**.

### 4.3 Painel direito — aba `Layout` (do slide atual)
Edita o bloco `slide.layout`:
- Alinhamento vertical/horizontal dos elementos.
- **Mídia:** adicionar via **URL**, **upload** ou **IA** (botão futuro) / **vídeo**; modo **cover** (fundo) ou **elemento** (bloco junto ao texto).
- **Fundo:** sólido ou **gradiente** (from/to/ângulo).
- **Máscara:** cor + intensidade do scrim sobre a mídia.

### 4.4 Canvas central
- **Faixa de slides** no topo: `1 … N [+]` (carrossel); cover/closing fixos; conteúdo reordenável/removível.
- **Slide central:** render Konva do frame ativo (na proporção atual).
- **Setas ‹ › + contador** (`1/10`).
- Bidirecional canvas ↔ painéis: clicar num elemento foca o campo correspondente.

```
components/editor/
  EditorLayout.tsx
  panels/  ChatTab · MarcaTab · TextoTab · LegendaTab · LayoutPanel
  canvas/  SlideStrip · SlideCanvas · CanvasNav
  fields/  (inputs reutilizáveis: alinhamento, cor, gradiente, máscara, mídia, handle…)
```

---

## Parte 5 — Renderer (Konva) + proporções

- `lib/renderer/layout-engine.ts` passa a receber `aspect_ratio`/dimensões e recalcular
  posições, tamanhos e wrap por proporção (1:1, 4:5, 9:16).
- Suporte a `background` sólido **e gradiente**; `media.mode` cover vs element; `mask` como Rect translúcido sobre a mídia, texto por cima.
- Marca renderizada na camada: logo (SVG), numeração, handle (+ avatar opcional).
- Fontes Sora prontas antes do draw (`waitForFonts`).
- Export: cliente gera PNG (`stage.toDataURL`) por frame; PDF monta as páginas no cliente (ou rota dedicada).

---

## Parte 6 — Features de navegação

### 6.1 Biblioteca
Grid de criações (thumbnail, formato, fase, status de publicação). Abrir → editor. (Base já existente, adaptar aos novos formatos/aspect ratio.)

### 6.2 Buscar conteúdo
Busca por texto/tópico, filtros por formato e fase, sobre criações + threads.

### 6.3 DNA (editor de `.md`)
- Árvore de `dna/` + `.claude/skills/comunicacao-funil/`.
- Editor markdown (visualizar + editar) que **grava direto** nos arquivos do repo.
- API: `/api/files/read` + `/api/files/write` (restritas a paths permitidos: dna, skills, identity).

### 6.4 Identidade Visual (editor de `.md`)
- Mesma mecânica do DNA, escopo `dna/identidade-visual/`.
- Bônus: viewer de logos/cores/tipografia (lendo `colors_and_type.css` + assets).

### 6.5 Base de Aplicações
- Lista/edita as bases (`config/bases/*.json`): paleta, tipografia, layouts por tipo, defaults de marca/máscara, formatos que atende.
- Preview de cada base aplicada a um exemplo.

### 6.6 Calendário
- Visão mensal/semanal dos conteúdos com `scheduled_at`.
- Editar/remarcar (reescreve `scheduled_at` no `content.json` e reflete na publicação).

### 6.7 Suas criações (threads)
- Lista de `thread.json` por `updated_at`.
- Abrir → reidrata chat + `content.json` no editor e continua de onde parou.

---

## Parte 7 — Publicação via Composio

Substitui o Activepieces. O app fala com a **API da Composio** (server-side) usando os
perfis de Instagram já conectados (OAuth feito na Composio).

```
App Next.js
  └─ /api/publish
       └─ exporta frames como PNG (cliente, Konva)
       └─ lista perfis Instagram conectados (Composio)
       └─ dispara ação de publish/schedule da Composio para o perfil escolhido
              → Instagram Graph API (containers + carousel + publish/scheduled_publish_time)
```

- **Multi-perfil:** o usuário escolhe entre os perfis conectados na Composio.
- **Agendar:** envia `scheduled_at`; **Publicar agora:** publica imediatamente.
- Carrossel: cada imagem vira container, depois o container carousel, depois publish.
- Estático/stories/anúncio: container único.
- Persistir `publish_status`, `published_at`/`scheduled_at`, `publish_targets` no `content.json`.

**Env:** `COMPOSIO_API_KEY` (acesso server-side aos connected accounts).

```
components/publish/  PublishDrawer · ProfileSelect · SchedulePicker · PublishStatus
```

---

## Parte 8 — Modo IDE (file watcher)

- Watcher recursivo em `marketing/conteudo/` (chokidar v4+, sem glob), filtrando `content.json`.
- SSE `/api/content/watch` emite `{ slug }`; o frontend assina via `useContentWatch` e
  atualiza o preview/editor sem reload.
- `caption.md` e `thread.json` opcionais na leitura (a LLM pode gravar em qualquer ordem).
- *(Já implementado e validado — manter.)*

---

## Parte 9 — Ordem de implementação

> Tudo faz parte da mesma iniciativa; as ondas evitam telas pela metade.

### Onda A — Fundação de marca + dados
1. Tokens do brandbook no Tailwind; tema claro; Sora; Lucide (Parte 0).
2. Novos schemas Zod: formato/proporção, `branding`, `slide.layout` (mídia/gradiente/máscara), thread, base de aplicação (Parte 1).
3. Migrar conteúdos/exemplos existentes para o novo schema.

### Onda B — Shell + composer
4. `AppShell` + `Sidebar` (240/64) + header (Parte 2).
5. Home do composer com seletores e anexos (Parte 3).
6. Persistência de thread + criação → editor.

### Onda C — Editor + renderer
7. `EditorLayout` (top bar, painéis, canvas) (Parte 4).
8. Abas Chat/Marca/Texto/Legenda + sync `.md`+`.json` (4.2).
9. Painel Layout (alinhamento, mídia, gradiente, máscara) (4.3).
10. Renderer por proporção + gradiente + máscara + marca (Parte 5).
11. Seletor de proporção recalculando layout (4.1).

### Onda D — Features de nav
12. Biblioteca (novos formatos) + Buscar (6.1, 6.2).
13. DNA + Identidade Visual (editor `.md` com escrita) (6.3, 6.4).
14. Base de Aplicações (editor de bases) (6.5).
15. Suas criações (threads) (6.7).
16. Calendário (6.6).

### Onda E — Publicação + export
17. Export PNG/PDF (Parte 5 / 4.1).
18. Publicação via Composio (multi-perfil, agendar/publicar) (Parte 7).

### Onda F — Integração e polish
19. Modo IDE ponta a ponta (Parte 8).
20. Bidirecionalidade canvas ↔ painéis; estados de loading/erro; QA por formato e proporção.

---

## Parte 10 — Replicação e extensibilidade

- **Outra empresa:** novo `dna/` com a mesma estrutura + `company_id`; o app não muda.
- **Multi-plataforma (futuro):** `platform` já é dimensão; adicionar formatos/proporções e
  o provider de publicação por plataforma sem refazer o schema.
- **Mídia por IA / vídeo:** `media.source = "ai"` e `media.kind = "video"` já previstos no schema;
  implementação dos geradores fica para uma fase futura.
```
