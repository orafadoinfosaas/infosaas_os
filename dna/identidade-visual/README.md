# Infosaas® Design System

A working design system for **Infosaas** — a Brazilian studio that develops and implements intelligent business solutions. The system documents the brand's tiny but opinionated visual language (one orange, three neutrals, one typeface) plus the voice rules that keep every artifact unmistakably Infosaas.

> **Mission.** Desenvolver e implementar soluções com clareza e sensatez para os negócios.
> **Visão.** Ser um studio referência no mercado brasileiro.

This repo is meant to be **read by design agents and humans alike** before producing any Infosaas-branded artifact — slides, landing pages, prototypes, app screens, social posts. Use the tokens in `colors_and_type.css`, the components in `ui_kits/`, and the rules in this README.

---

## Sources of truth

Everything in this system was derived from material the team has already published. If you have access, read the originals — they go deeper than this summary.

| Source | URL / path |
|---|---|
| Infosaas OS (brand knowledge base, voice, ICPs, products) | <https://github.com/orafadoinfosaas/infosaas_os> |
| AGENTS.md (root rules for AI agents) | `orafadoinfosaas/infosaas_os/AGENTS.md` |
| Voice & tone | `dna/empresa/VOZ.md` |
| Design rules | `dna/empresa/DESIGN.md` |
| Positioning | `dna/empresa/POSICIONAMENTO.md` |
| ICPs (Educação, Saúde, Enterprise) | `dna/perfil-de-cliente-ideal/ICPS.md` |
| Content skills (Descoberta, Relacionamento, Prontidão) | `marketing/conteudo/plataforma-a/criacoes/skills/` |
| Brand assets (logos PNG/SVG, banner applications) | `dna/ativos/` |
| Provided uploads | `uploads/logo-{black,branco,laranja}.png`, `uploads/simbolo-*.png` |

If you are extending this system, **open the GitHub repo above** and pull product-specific copy (BENEFICIOS, OBJEÇÕES, TRANSFORMACOES per product) directly from `dna/produtos/`.

---

## At a glance

**Company.** Studio (not a software-house) — 10 years in market, NPS 9.2, 10 senior professionals, R$10M+ revenue. Clients include G4 Educação, V4 Company, Instituto Singular, Phlebo Academy.

**Positioning.** Premium. Ticket starts at R$ 20.000/month; target contract R$ 250–500k+. Focus on Education, Health and Enterprise (R$3M+ ARR).

**Products.** MVP ágil · Soluções Enterprise · Suporte Premium · Consultoria Estratégica (CEO + CMO).

**Visual signature.** Saturated red-orange (`#FF3D00`) used at full bleed, with the symbol mark blown up into the background as a low-contrast tonal overlay. Heavy Sora 700/800 set tight, often in three short lines stacked.

---

## CONTENT FUNDAMENTALS

Infosaas writes the way it positions: **direct, confident, no filler**. Formal where it counts, warm where it can be.

### Voice in one paragraph
A premium B2B studio writing for senior decision-makers (CEO, CTO, sócio-fundador). Mixes formality with proximity and a touch of lightness — *"não somos terno e gravata, mas também não somos sem dresscode"*. References: Anthropic, OpenAI, Google, Apple. **No hype. No hedging. No corporatês.**

### Person & address
- Portuguese (Brazilian) is the primary language. Use *você*, never *o senhor / vocês* in marketing.
- **Talk about the client's *negócio*, not "their tech".** Tech is the means.
- First-person plural ("nós", "a gente") for the studio; never anonymous "a empresa".

### Words we ALWAYS use
**Studio** (never *software-house*) · **Parceiro** (never *fornecedor*) · **Negócio** · **Sensatez** · **Clareza** · **Resultado** (always specific).
Recurring phrases: *"do início ao fim"* · *"pensa junto"* · *"feito do jeito certo"* · *"escalar com sustentabilidade"* · *"sênior"*.

### Words we NEVER use
*Em conclusão · Ademais · Além disso · É importante notar que · Na sociedade atual · Alavancar · Sinergia · Tecnologia de ponta · Solução robusta · Perfeitamente integrado · Aproveitando o poder de · No mundo acelerado de hoje · Resultados revolucionários · Transformando a indústria · Utilizar.*
Every one of these is on the team's official block-list.

### Construction rules
- **Premissas, não promessas** — except in *Prontidão* content (bottom-of-funnel), where direct promises are explicitly allowed.
- **Início forte, sem imperativo.** Never open with *"Aprenda…"*, *"Descubra…"*, *"Transforme…"*.
- **Big Ideas talk about the ICP, not Infosaas.** The reader should think *"é exatamente o que acontece comigo"*.
- **Sounds like a conversation, not an ad.**
- Never opens with *"Nós somos os melhores…"* or variants.

### Casing
- Headings & display: sentence case, often with periods at the end of each line (see *Nova fase. Novos desafios. A mesma essência.*).
- The wordmark is **lowercase: `infosaas®`** — always lowercase, always with the registered mark.
- Buttons: sentence case (e.g. *Fale com a gente*, not *FALE CONOSCO*).
- ALL-CAPS only for short eyebrows / labels — never for full sentences.

### Emoji & symbols
- **No emoji in product UI or marketing prose.** The internal `infosaas-os.md` repo uses a few (📁 📄) as wayfinding in docs, but they don't appear in customer-facing surfaces.
- The registered mark **®** sits next to *infosaas* in every wordmark application.
- Periods at the end of stacked display lines are part of the brand voice; use them.

### Voice examples (lifted directly from brand assets)
> *Nova fase. Novos desafios. A mesma essência.*

> *Não somos uma software-house que recebe escopo, executa e some. Somos um studio que pensa junto com o negócio — da estratégia à entrega.*

> *Cada projeto carrega a mesma equipe sênior do início ao fim.*

Big-idea seeds (from `marketing/.../DESCOBERTA.md`):
> *"O sistema que funciona hoje é o mesmo que vai te travar amanhã."*
> *"Não foi a ideia que falhou. Foi o software que não aguentou."*

---

## VISUAL FOUNDATIONS

The system is **deliberately minimal**. One accent, three neutrals, one typeface, big blocks of color, heavy type. Restraint is the point — it lets the orange and the symbol do the work.

### Colors
| Token | Hex | Role |
|---|---|---|
| `--laranja` | `#FF3D00` | Single brand accent. Used at full bleed for hero blocks; as CTA fill; as a single colored word inside black/white type. Never tinted/shaded in published marketing. |
| `--preto` | `#000000` | Primary text on light surface; inverted hero / footer background. |
| `--branco-off` | `#F5F5F5` | Default page background — slightly warm, never pure white. |
| `--cinza-claro` | `#D9D9D9` | Borders, dividers, disabled state, table grid. |

Internal-only tints (`--laranja-press`, `--laranja-hover`, `--laranja-soft`, `--laranja-deep`) exist in `colors_and_type.css` for UI states and for the **decorative low-contrast glyph overlay** seen in the banner assets — never publish them as "secondary brand colors."

**Color combinations that are on-brand**
- White type on full-bleed `--laranja` (banner posture)
- Black type on `--branco-off` (default documents, app body)
- White type on `--preto` (inverted hero / footer)
- `--laranja` accent dropped into a single word, button, or KPI inside otherwise black/white type

Combinations to avoid: orange-on-black large surface; orange-on-white tinted gradients; multi-color rainbow palettes; pastel washes.

### Typography
- **Sora** is the only typeface — display, headings and body all in Sora. Weights in use: 300 (rare, for very large display), 400, 500, 600, **700 (default heading)**, **800 (display)**.
- Display lines are set **tight** (line-height ≈ 0.95) with negative tracking (`-0.02em`).
- Body is 16–18px with 1.55 line-height, full-color black on off-white.
- We use `JetBrains Mono` for code samples only.
- See `colors_and_type.css` for the full scale (`--fs-display-xl` → `--fs-caption`).

### Spacing & rhythm
- 4-px base scale (`--space-1` = 4px … `--space-10` = 128px).
- Marketing layouts breathe — section padding is typically `--space-8` (64px) or `--space-9` (96px) on desktop.
- App / dashboard density follows a 16-px grid with 8-px micro-spacing.

### Corner radii
- The mark itself is a chunky rounded square — that radius ratio is echoed throughout the system.
- `--radius` 12px (inputs, list rows) · `--radius-md` 18px (buttons) · `--radius-lg` 24px (cards) · `--radius-xl` 32px (hero blocks).
- Never use sharp 0-px corners except for fullbleed sections.

### Backgrounds & motifs
Three patterns repeat across the brand:
1. **Solid orange block** with the *símbolo* blown up to 60–120% of the frame, offset, and rendered in `--laranja-deep` (a low-contrast tonal overlay). Heavy Sora type sits on top.
2. **Off-white documents** (`--branco-off`) with generous margins, black type, single orange accent on a word, KPI or CTA.
3. **Portrait photography on painted orange backdrop** — warm, naturally lit, real people (no stock-looking gradients). Subjects are smiling, hands visible, casual professional dress. See `assets/banners/portrait-orange.png`.

No bluish-purple gradients. No glass/blur effects. No emoji cards. No left-border-only colored cards.

### Borders, shadows, elevation
- **Hairline** borders are `1px solid var(--border)` (cinza-300). Cards on `--branco-off` use a hairline + `var(--shadow)`.
- **Stamped** borders are `1.5–2px solid var(--border-strong)` (preto), used on dark-mode-feeling components or print-style modules.
- Shadow system: `--shadow-sm` for inputs · `--shadow` for cards · `--shadow-lg` for floating menus / modals · `--shadow-accent` for hovered CTAs (subtle orange glow).
- Elevation is restrained — we don't stack 4+ shadows.

### Hover, press & focus states
- **Buttons (primary)**: hover → `--accent-hover` (`#FF5520`) + `--shadow-accent`. Press → `--accent-press` (`#E03600`) + scale(0.985).
- **Buttons (secondary / ghost)**: hover → fill becomes `--cinza-200`. Press → `--cinza-300`.
- **Links**: hover underlines (1-px), no color change.
- **Focus rings**: `0 0 0 3px rgba(255,61,0,0.35)` — orange halo, not the default browser blue.
- No bouncy spring animations. Use `--ease` (`cubic-bezier(0.2, 0.7, 0.2, 1)`) and durations 120/200/320ms.

### Motion
- Fades + small translates (≤8px). No bouncing, no rotating, no parallax beyond a faint background drift.
- Page transitions: cross-fade 200ms.
- Hover lift on cards: `translateY(-2px)` over 200ms.

### Transparency & blur
- Used **only** for the decorative oversized symbol overlay (~12% darken on orange).
- No frosted glass / `backdrop-filter` in production surfaces.

### Imagery
- Portraits: warm, natural light, slight contrast bump. **Always shot against painted orange paper.** B&W and cool palettes are off-brand.
- No stock-photo-looking imagery; no illustrative gradients.
- Decorative SVG: only the *símbolo* mark, scaled large and faded — never invented illustrations.

### Layout rules
- Marketing hero: 3 stacked one-line statements, left-aligned, white on orange, symbol mark in top-left.
- Document layout: max content width ~1200px; 96px top/bottom section padding; 24-px grid gap.
- App chrome: 240px sidebar (collapsible to 64px), 64-px top bar, 16-px content padding.
- Sticky elements (header) get a 1-px bottom hairline and `--branco` background (never tinted).

---

## ICONOGRAPHY

Infosaas does not maintain its own icon system. The only proprietary mark is the **símbolo** — the chunky rounded-square `S` glyph (see `assets/logos/simbolo-*.svg`), which is used as a logo element and a decorative motif, **not** as a UI icon.

### What we use
- **Lucide** (`lucide.dev`) — primary icon set for product and dashboard UI. Strokes-only, 1.5–2px weight, 24px box. Loaded from CDN: `https://unpkg.com/lucide@latest`.
- The Infosaas **símbolo** in three colorways (laranja / preto / branco) as logo + decorative motif.
- Customer / partner logos rendered monochrome in `--preto` or `--branco-off` for proof-bars.

> **Substitution flag:** the brand source did not specify an icon library — we chose **Lucide** as the closest match to the brand's clean, confident weight. If the team prefers a different system (Phosphor, Tabler, custom set), swap and re-export.

### What we don't use
- **No emoji** in customer-facing UI.
- **No mixed icon sets** in the same surface — Lucide everywhere or nothing.
- **No filled / duotone / 3D icons.**
- **No unicode glyphs as icons** (★ ✓ etc.); use the Lucide equivalents.

### How icons are sized
- 16-px next to body text (inline label icons).
- 20-px for input prefixes/suffixes and tab bars.
- 24-px as standalone affordances (toolbar, sidebar).
- Stroke `currentColor` so they inherit text color — never hard-coded.

### Logo usage
Six versions live in `assets/logos/` — wordmark + symbol, each in black / branco (white) / laranja (orange), both SVG and PNG.

| When you're on… | Use this version |
|---|---|
| Off-white / light background | `logo-black.svg` (preferred) or `logo-laranja.svg` |
| Black / dark background | `logo-branco.svg` |
| Orange (`--laranja`) background | `logo-branco.svg` (white wordmark — see `assets/banners/logo-bloom.png`) |
| Print / single-color reproduction | `logo-black.svg` |

Minimum clear space = the height of the símbolo on every side. Minimum size: 24px tall for the símbolo alone, 80px wide for the full lockup. The ® always sits to the upper-right of the *s* in *infosaas*.

---

## Index — files in this project

```
.
├── README.md                 ← this file
├── SKILL.md                  ← Agent-Skills-compatible entry point
├── colors_and_type.css       ← all color + type tokens, the only stylesheet you need
├── assets/
│   ├── logos/                ← logo-{black,branco,laranja}.{svg,png}, simbolo-*
│   └── banners/              ← reference banner applications
├── dna/ativos/               ← raw imports from infosaas_os (logos + banner sources)
├── preview/                  ← Design System tab cards (one per concept)
└── ui_kits/
    └── marketing/            ← marketing-site UI kit (hero, nav, cards, footer)
        ├── index.html        ← interactive demo of the kit
        ├── *.jsx             ← React components
        └── README.md
```

### Where to start
1. **Designing slides / mocks?** Open `ui_kits/marketing/index.html` to see the live brand. Lift components and tokens.
2. **Writing copy?** Read this file's *Content fundamentals* section, then the original `dna/empresa/VOZ.md` on GitHub.
3. **Building a new product surface?** Copy `colors_and_type.css` into your project, link Sora from Google Fonts (or self-host), and use the semantic CSS vars (`--bg`, `--fg`, `--accent`, …).
4. **Using this from Claude Code?** Read `SKILL.md`.

---

## Caveats & open items
- The brand's official font is **Sora**, served from Google Fonts here. If the team has self-hosted .woff2 files, drop them in `fonts/` and update the `@import` in `colors_and_type.css`.
- **Lucide** is a chosen substitution — the source documents do not name an icon set. Flag if the team has a preferred library.
- Photography style is inferred from one reference banner (`assets/banners/portrait-orange.png`). A broader photo library + shot guidelines should be added before scale.
- Only the marketing UI kit is included — the studio's products are services, so there is no product app to reproduce. If a customer-facing app exists, point us at the codebase and we'll add a second kit.
