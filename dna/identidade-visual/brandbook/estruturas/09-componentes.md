# Seção 09 — Componentes

> **Propósito desta seção no brandbook:** Documentar todos os componentes do sistema Infosaas® — anatomia, variantes, estados e regras de uso. Cada componente tem uma função específica e não deve ser adaptado ad hoc. Se um novo componente for necessário, deve ser adicionado ao sistema, não improvisado.

---

## Índice de componentes

1. [Botões](#1-botões)
2. [Cards e blocos de conteúdo](#2-cards-e-blocos-de-conteúdo)
3. [Formulários e inputs](#3-formulários-e-inputs)
4. [Seções e navegação](#4-seções-e-navegação)
5. [Badges](#5-badges)
6. [Bento Grid](#6-bento-grid)
7. [Pricing Card](#7-pricing-card)
8. [Value Stack (Seção de Preços)](#8-value-stack-seção-de-preços)
9. [FAQ Accordion](#9-faq-accordion)
10. [Trust Badges](#10-trust-badges)
11. [Social Proof Bar](#11-social-proof-bar)
12. [Stats Banner](#12-stats-banner)
13. [Logo Strip](#13-logo-strip)
14. [Chat Bubbles](#14-chat-bubbles)
15. [Founder / Bio](#15-founder--bio)
16. [Final-Closer CTA](#16-final-closer-cta)

---

## 1. Botões

### Variantes

| Variante | Classe | Uso |
|---|---|---|
| Primário | `.btn--primary` | CTA principal da página — 1 por seção no máximo |
| Escuro | `.btn--dark` | CTA em fundos claros com menos hierarquia que o primário |
| Branco | `.btn--white` | CTA em fundos escuros ou laranja |
| Ghost light | `.btn--ghost-light` | Ação secundária em fundo escuro/laranja |
| Com seta | `.btn--arrow` | Adicionar `→` ao final — para links de navegação |

### Estados

| Estado | Visual |
|---|---|
| Default | Cor base da variante |
| Hover | `--laranja-hover` (#FF5520) + `--shadow-accent` |
| Press | `--laranja-press` (#E03600) + `scale(0.985)` |
| Disabled | Opacidade 40%, sem cursor pointer |
| Focus | `box-shadow: 0 0 0 3px rgba(255,61,0,0.35)` |

### Anatomia

- Padding: 12px 24px (padrão) · 10px 20px (pequeno)
- Border-radius: `--radius-md` (18px)
- Font: Sora 600, 15px, sentence case
- Transição: 120–200ms `--ease`
- Nunca usar ALL CAPS em botões
- Nunca mais de 2 botões em sequência imediata

---

## 2. Cards e blocos de conteúdo

### Item Card

Usado em grids de características, features e dores.

- Fundo: `--bg-elev` (branco)
- Borda: 1px solid `--border` (cinza-300)
- Raio: `--radius-lg` (24px)
- Padding: `--space-6` (32px)
- Layout: flex coluna, gap `--space-3`
- H3: Sora 700, 18px
- P: 15px, cinza-600, line-height 1.6
- Hover: `translateY(-1px)` + `--shadow`

### Feature Card (Bento)

Card de feature maior, com possibilidade de imagem/screenshot.

- Fundo: `--bg-elev`
- Raio: `--radius-xl` (32px)
- Padding: `--space-7` (48px)
- Pode incluir: eyebrow, headline, body, imagem/screenshot, CTA link

### Testimonial / Depoimento Card

- Fundo: `--bg-elev` com borda `--border`
- Raio: `--radius-lg`
- Estrutura: citação (Sora 400, 16px) → nome + empresa (Sora 600, 14px)
- Sem foto de avatar — apenas nome e empresa
- Aspas: `"` em laranja, Sora 900, 48px

### Solução Card (horizontal)

Usado nas páginas de segmento para listar soluções relevantes.

- Layout: flex row, alinhado ao centro
- H3 com `min-width: 200px`
- P: flex: 1
- Link: Sora 600, 14px, laranja
- Hover: `translateY(-1px)` + `--shadow`

---

## 3. Formulários e inputs

### Input de texto

- Altura: 48px
- Padding: 12px 16px
- Borda: 1px solid `--border` (cinza-300)
- Raio: `--radius` (12px)
- Font: Sora 400, 16px
- Placeholder: cinza-500
- Focus: borda vira laranja + `--shadow-sm`
- Error: borda vermelha `#E53935` + mensagem abaixo

### Textarea

- Mesmos estilos do input
- `resize: vertical` — nunca `resize: none`
- Min-height: 120px

### Select

- Aparência customizada — nunca o select padrão do browser
- Chevron (Lucide `ChevronDown`) no canto direito
- Mesmos estilos de input

### Label

- Sora 500, 14px, cinza-700
- Sempre acima do campo, nunca placeholder substituindo label
- Campos obrigatórios indicados com `*` em laranja

### Estados de validação

| Estado | Visual |
|---|---|
| Default | Borda cinza-300 |
| Focus | Borda laranja + shadow-sm |
| Error | Borda `#E53935` + mensagem de erro abaixo em 13px |
| Success | Borda `#22C55E` + ícone `Check` à direita |
| Disabled | Fundo cinza-100, cursor not-allowed |

---

## 4. Seções e navegação

### Padrões de seção

| Classe | Fundo | Texto |
|---|---|---|
| `.section` (padrão) | `--branco-off` | preto |
| `.section--white` | `#FFFFFF` | preto |
| `.section--dark` | `--preto` | branco-off |
| `.section--accent` | `--laranja` | branco |

Todas as seções usam `.container` (max-width: 1240px) e `padding-block: --space-8`.

### Header

#### Visão geral

O header é o componente de navegação global do site. Aparece em todas as páginas, fixo no topo, e é o ponto de entrada para Soluções, Segmentos e contato comercial.

#### Anatomia

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo Infosaas®]      Soluções ↓  Segmentos ↓  O Studio   [Falar com a gente →]  │
└──────────────────────────────────────────────────────────────┘
```

- **Posição:** `position: fixed`, `top: 0`, `z-index: 100`, full width
- **Altura:** 72px
- **Background:** `--bg-hero` — vinho escuro, aproximadamente `#3D0900`. Token dedicado, separado do `--laranja-deep`. Não é transparente.
- **Container interno:** max-width 1240px, padding lateral 32px (desktop) / 20px (mobile)
- **Layout:** `display: flex`, `align-items: center`, `justify-content: space-between`

#### Elementos e posicionamento

| Elemento | Posição | Detalhes |
|---|---|---|
| Logo | Extrema esquerda | Versão branca (`logo-branco.svg`) — altura 28px |
| Navegação | Direita, antes do CTA | `display: flex`, `gap: 36px`, `align-items: center` |
| CTA | Extrema direita | Botão `.btn--header` — ver variante abaixo |

#### Tipografia da navegação

- Font: Sora 500, 15px
- Cor: `#FFFFFF` (branco puro)
- Letter-spacing: normal
- `cursor: pointer` em todos os itens

#### Itens de navegação

| Item | Tipo | Comportamento |
|---|---|---|
| Soluções | Com dropdown | Exibe chevron `↓` à direita do texto. Abre submenu no hover e no click. |
| Segmentos | Com dropdown | Exibe chevron `↓` à direita do texto. Abre submenu no hover e no click. |
| O Studio | Link direto | Sem chevron. Navega diretamente. |

Chevron: ícone `ChevronDown` (Lucide), 16px, alinhado ao baseline do texto, gap 4px.

#### CTA do Header — variante `.btn--header`

- Background: `#FFFFFF`
- Cor do texto: `#000000` (preto)
- Border-radius: `--radius-pill` (999px)
- Padding: 10px 22px
- Font: Sora 600, 15px
- Texto: `Falar com a gente →` — o `→` é parte do texto, não um ícone separado
- Hover: background `--cinza-200`, transição 120ms `--ease`
- Press: `scale(0.985)` 120ms

#### Estados dos itens de nav (hover / active)

| Estado | Visual |
|---|---|
| Default | Texto branco, opacidade 1 |
| Hover | Opacidade 0.75, chevron rotaciona para cima (180°) em 200ms `--ease` |
| Dropdown aberto | Opacidade 1, chevron apontando para cima, item sublinhado com 2px laranja abaixo |
| Active (página atual) | Sublinhado 2px `--laranja` permanente |

#### Dropdown — comportamento

- **Trigger:** hover (desktop) e click (mobile/touch)
- **Animação de abertura:** `opacity 0→1` + `translateY(-6px)→translateY(0)` em 200ms `--ease-out`
- **Animação de fechamento:** `opacity 1→0` + `translateY(0)→translateY(-4px)` em 150ms `--ease`
- **Fechar:** ao mover o mouse para fora da área nav + dropdown (com delay de 80ms para evitar fechamento acidental)
- **Background do dropdown:** `#FFFFFF`
- **Raio:** `--radius-lg` (24px)
- **Sombra:** `--shadow-lg`
- **Posição:** abaixo do item de nav, alinhado à esquerda do item, offset vertical 8px
- **Conteúdo:** a ser documentado conforme as páginas de Soluções e Segmentos forem definidas

#### Sticky behavior

- Fixo desde o carregamento — não muda de fundo ao rolar
- Sem transição de transparente para opaco
- O background `--bg-hero` é fixo em todas as posições de scroll

#### Mobile (< 768px)

- Ocultar itens de nav e CTA
- Exibir ícone hambúrguer (`Menu`, Lucide, 24px, branco) na direita
- Ao clicar: abrir drawer lateral ou overlay full-screen com os itens empilhados
- Drawer: background `--bg-hero`, texto branco, Soluções e Segmentos expandem verticalmente (accordion)

#### Token a criar

```css
--bg-hero: #3D0900; /* Fundo do header e seção hero — vinho escuro */
```

Este token não existe ainda na paleta padrão. Deve ser adicionado ao `colors_and_type.css`.

---

### Hero-01 (Home — Seção Herói Principal)

#### Visão geral

Primeira seção de conteúdo logo abaixo do header fixo. Define o posicionamento da marca em uma headline de impacto máximo. Esta variante é exclusiva da Home — outras páginas podem usar variantes diferentes do hero.

#### Anatomia

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Estratégia, Negócios                                             │
│   & Tecnologia                                                     │
│                                                                    │
│   A Infosaas® é um studio de desenvolvimento                       │
│   e aceleração de negócios.                                        │
│                                                                    │
│   [Falar com a gente →]   [Conheça nossas soluções]               │
│                                                                    │
│ ─────────────────────────────────────────────────────────────────  │
│  Confiado por   [G4]  [W COMPANY]  [microsaas]  [CSC]  [turbsX]  [rufy]  │
└────────────────────────────────────────────────────────────────────┘
```

#### Layout e container

| Propriedade | Valor |
|---|---|
| Background color | `--bg-hero: #3D0900` — fallback e cor base (mesmo token do header) |
| Background image | `BG-SITE.png` · `background-size: cover` · `background-position: center` — gradiente radial laranja/vinho · arquivo em `dna/identidade-visual/ativos/` |
| Min-height | `100vh` — ocupa o viewport inteiro |
| Padding-top | `calc(72px + var(--space-9))` — compensa o header fixo (72px) + respiro |
| Padding-bottom | `var(--space-8)` (64px) |
| Container max-width | 1240px |
| Padding lateral | 32px (desktop) / 20px (mobile) |
| Alinhamento do conteúdo | Left — nunca centralizado |

#### Headline

| Propriedade | Valor |
|---|---|
| Texto | "Estratégia, Negócios & Tecnologia" — quebra após "Negócios" |
| Font | Sora 900 |
| Tamanho | `clamp(56px, 8vw, 96px)` |
| Cor | `#FFFFFF` |
| Letter-spacing | `-0.03em` |
| Line-height | `0.95` |
| Max-width | 700px |
| Margin-bottom | `var(--space-5)` (24px) antes do subheadline |

#### Subheadline

| Propriedade | Valor |
|---|---|
| Texto | "A Infosaas® é um studio de desenvolvimento e aceleração de negócios." |
| Font | Sora 400 |
| Tamanho | 18px |
| Cor | `rgba(255, 255, 255, 0.72)` |
| Max-width | 520px |
| Line-height | 1.6 |
| Margin-bottom | `var(--space-6)` (32px) antes dos CTAs |

#### CTAs

Dois botões, dispostos horizontalmente com `gap: var(--space-4)` (16px).

| Botão | Estilo |
|---|---|
| **Primário** — `Falar com a gente →` | Background `--preto` (`#0A0A0A`), cor `#FFFFFF`, border-radius `--radius-pill` (999px), padding 13px 28px, Sora 600 15px. A seta `→` é parte do texto. |
| **Secundário** — `Conheça nossas soluções` | Background transparente, border `1.5px solid rgba(255,255,255,0.30)`, cor `rgba(255,255,255,0.9)`, border-radius `--radius-pill` (999px), padding 13px 28px, Sora 600 15px. |

Hover primário: `background: #1a1a1a` + `scale(1.01)` em 120ms `--ease`.  
Hover secundário: `border-color: rgba(255,255,255,0.6)` em 120ms `--ease`.

#### Logo strip de clientes

Separada do conteúdo acima por `1px solid rgba(255,255,255,0.15)` + margin-top `var(--space-7)`.

| Propriedade | Valor |
|---|---|
| **Tipo** | **Slider infinito animado** — scroll horizontal contínuo, automático, sem interação do usuário |
| Eyebrow | "Confiado por grandes empresas" — Sora 400, 11px, `rgba(255,255,255,0.35)`, uppercase, letter-spacing 0.08em |
| Logos exibidos | G4, W Company, microsaas, Comunidade Sem Codar, TurboX, Rufy |
| Altura por logo | 28–32px |
| Gap entre logos | `var(--space-7)` (48px) |
| **Animação** | `translateX(0 → -50%)` · `25s linear infinite` — o set de logos é duplicado no DOM para o loop ser seamless |
| Overflow | Wrapper com `overflow: hidden` + fade lateral via `mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)` |
| Normalização de cor | `filter: brightness(0) invert(1)` + `opacity: 0.5` — converte qualquer logo para branco neutro sobre fundo escuro |
| Regra | Logos sempre monocromáticos no strip — nunca usar versão colorida. Ver seção 11 do brandbook. |

```css
/* Implementação do slider */
.hero-logo-track-wrap {
  overflow: hidden;
  flex: 1;
  mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
}
.hero-logo-track {
  display: flex;
  align-items: center;
  gap: var(--space-7); /* 48px */
  width: max-content;
  animation: hero-logos-scroll 25s linear infinite;
}
@keyframes hero-logos-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

> **Regra de duplicação:** o HTML deve conter o set de logos duas vezes dentro de `.hero-logo-track`. A animação percorre 50% da largura total, retornando ao início de forma invisível.

#### Responsividade

| Breakpoint | Ajuste |
|---|---|
| Tablet (< 1024px) | Headline diminui por `clamp` — sem quebras manuais |
| Mobile (< 768px) | CTAs empilhados verticalmente (flex-direction: column) · Logo strip com scroll horizontal suave |

#### Regras

- Nunca centralizar o texto do hero — alinhamento à esquerda é intencional
- Nunca usar outra cor de background além de `--bg-hero` nesta variante
- Nunca adicionar mais de 2 CTAs
- O eyebrow da logo strip deve sempre mencionar confiança ou clientes — nunca usar apenas logos sem contexto

### Footer

- Fundo preto, texto branco-off
- 4 colunas em desktop, 2 em tablet, 1 em mobile
- Logo branco no canto superior esquerdo
- Links: cinza-400, hover branco

### Hero (HeroAccent)

- Fundo laranja ou preto dependendo da variante
- Eyebrow → Headline (display, 3 linhas) → Sub → CTA(s)
- Símbolo decorativo em background (variante laranja)

### CTA Section

- Variantes: `accent` (laranja), `dark` (preto), `light` (branco-off)
- Headline + sub + botão CTA
- Alinhamento: left (nunca centralizado)

---

## 5. Badges

Pequenos rótulos de status, categoria ou destaque.

### Variantes

| Variante | Fundo | Texto | Uso |
|---|---|---|---|
| Laranja sólido | `--laranja` | branco | Destaque principal |
| Laranja soft | `--laranja-soft` | laranja | Rótulo sutil |
| Neutro | cinza-200 | cinza-700 | Status neutro |
| Preto | preto | branco | Dark mode |

### Anatomia

- Padding: 4px 10px
- Raio: `--radius-sm` (6px) ou `--radius-pill` (999px)
- Font: Sora 500, 12px, sentence case
- Sem ícones por padrão — adicionar apenas se necessário para clareza

---

## 6. Bento Grid

Layout de grid assimétrico para apresentar features, diferenciais ou casos de uso de forma visual.

### Estrutura

- Grid: 2–3 colunas, células de tamanho variável
- Células grandes: ocupam 2 colunas ou 2 linhas
- Células pequenas: 1×1
- Gap: `--space-5` (24px)
- Raio de cada célula: `--radius-xl` (32px)

### Conteúdo de cada célula

- Eyebrow (opcional)
- Headline curta (1–2 linhas)
- Body (opcional, máx 2 linhas)
- Imagem/screenshot/ícone (opcional, no topo ou base da célula)

### Regras de bento

- Máximo 6 células por grid
- Não misturar células com e sem imagem na mesma grade
- Fundo de célula: branco ou branco-off — nunca laranja dentro do bento
- Padding interno: `--space-7` (48px)

---

## 7. Pricing Card

Card de plano/preço individual.

### Anatomia

- Fundo: branco (`--bg-elev`) com borda `--border`
- Raio: `--radius-lg` (24px)
- Padding: `--space-7`
- Eyebrow (nome do plano)
- Preço grande (Sora 900, clamp(40px→56px)) com "a partir de" em cinza-500
- Período (mensal/contrato) em cinza-500, 14px
- Separador hairline
- Lista de features: ícone `Check` em laranja + texto Sora 400 15px
- CTA botão no fundo (primário ou ghost)

### Variante destaque

- Borda `2px solid --laranja` ou fundo `--laranja-soft`
- Badge "Mais escolhido" ou similar

---

## 8. Value Stack (Seção de Preços)

Seção que apresenta os itens incluídos em um produto — não necessariamente com preço visível.

### Estrutura

- Eyebrow → Headline de 2–3 linhas → Destaque numérico (ex: "20h+")
- Lista vertical de itens com numeração em laranja
- Cada item: número (01, 02...) + título + descrição

### Destaque numérico

- Número grande: Sora 900, 56px, laranja
- Texto ao lado: Sora 400, `--fs-body-lg`, cinza-700
- Fundo: `--laranja-soft`, borda `rgba(255,61,0,0.2)`, raio `--radius-lg`

---

## 9. FAQ Accordion

Lista de perguntas frequentes colapsável.

### Anatomia

- Lista vertical com separador hairline entre items
- Cada item: pergunta (Sora 700, 16px) + ícone `ChevronDown`
- Estado aberto: `ChevronUp` + resposta exibida com fade + slide
- Resposta: Sora 400, 15px, cinza-600, padding-bottom `--space-4`

### Estados

| Estado | Visual |
|---|---|
| Fechado | Apenas pergunta visível |
| Aberto | Pergunta + resposta, ícone rotaciona 180° |
| Hover | Leve escurecimento do background |

### Regras

- Apenas 1 item aberto por vez (exceto se há decisão contrária)
- Máximo 8–10 itens por FAQ
- Perguntas curtas (máx 80 caracteres)

---

## 10. Trust Badges

Selos de confiança para reforçar credibilidade.

### Variantes

- **Número + label:** Ex: "NPS 9.2" + "satisfação dos clientes" — Sora 900 para o número, 700 para o label
- **Ícone + texto:** Shield/Check + texto de garantia
- **Anos de mercado:** "10 anos" grande + "de mercado" menor

### Anatomia

- Fundo: transparente ou `--laranja-soft`
- Borda: 1px solid `--border` ou `rgba(255,61,0,0.2)`
- Raio: `--radius-lg`
- Padding: `--space-5`
- Número: Sora 900, 40–56px, preto ou laranja
- Label: Sora 500, 14px, cinza-600

---

## 11. Social Proof Bar

Barra horizontal com logos de clientes ou números de prova social.

### Variantes

**Logo strip (estática):**
- Logos de clientes em cinza-400 (monocromático)
- Sem hover
- Fundo branco-off ou transparente

**Logo strip (animada):**
- Scroll horizontal infinito
- Logos em cinza-400
- Velocidade: lenta, suave — não parece arrancada

**Stats bar:**
- Grid horizontal de 3–4 métricas
- Cada métrica: número grande (Sora 900) + label (Sora 500, cinza-600)

### Regras

- Logos sempre monocromáticos (preto ou cinza-400) — nunca coloridos
- Nunca mais de 10 logos em uma strip
- Sempre com eyebrow acima: "Clientes que confiam", "Parte do portfólio"

---

## 12. Stats Banner

Seção de números de prova social com destaque visual.

### Anatomia

- Grid 3–4 colunas em desktop, 2 em tablet
- Cada stat: número (Sora 900, display large) + label (Sora 500, 16px)
- Separador vertical entre stats (1px cinza-300)
- Pode ter eyebrow e headline acima do grid

### Valores de referência

- R$ 10M+ faturados
- NPS 9.2
- 10 profissionais sênior
- 10 anos de mercado
- 20+ clientes ativos

---

## 13. Logo Strip

Barra de logos de clientes/parceiros.

### Implementação

```css
/* Scroll animado */
.logo-strip-track {
  display: flex;
  gap: var(--space-8);
  animation: scroll-left 30s linear infinite;
}
@keyframes scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
```

### Regras

- Logos em cinza-400 — hover: cinza-700 (opcional, sutil)
- Altura padrão: 28–36px para cada logo
- Duplicar o set de logos para o loop ser seamless

---

## 14. Chat Bubbles

Componente para simular diálogo — usado para mostrar objeções, dores do cliente ou conversas.

### Anatomia

- Bolha esquerda: fundo cinza-200, texto preto — representa o cliente
- Bolha direita: fundo `--laranja`, texto branco — representa a Infosaas®
- Raio: `--radius-lg` com um canto "cortado" para simular cauda de balão
- Font: Sora 400, 15px
- Max-width por bolha: 60% do container

### Uso

- Mostrar objeção do cliente + resposta da Infosaas®
- Mostrar "antes" (dor) e "depois" (solução)
- Nunca usar para diálogos genéricos ou sem propósito de conversão

---

## 15. Founder / Bio

Card de perfil dos fundadores — usado na Consultoria Estratégica e páginas de time.

### Anatomia

- Fundo: `--bg-elev`, borda `--border`, raio `--radius-lg`
- Padding: `--space-7`
- Nome: Sora 700, `--fs-h3`
- Cargo: Sora 500, 13px, laranja, uppercase, letter-spacing 0.08em
- Bio: Sora 400, 15px, cinza-600, line-height 1.65
- Foto: opcional — se incluída, circular ou retangular com raio `--radius-lg`

### Regras

- Máximo 2 founders por seção
- Bio concisa: máx 3 linhas (60 palavras)
- Cargo sempre em laranja uppercase

---

## 16. Final-Closer CTA

Seção de fechamento de página — última chamada para ação antes do footer.

### Anatomia

- Fundo: laranja ou preto (variante `accent` ou `dark`)
- Headline: Sora 900, display, 3 linhas empilhadas, branco
- Sub (opcional): Sora 400, 18px, rgba(255,255,255,0.8)
- Botão: `.btn--white` ou `.btn--ghost-light`
- Alinhamento: left — nunca centralizado

### Regras

- Aparece sempre como penúltima seção (antes do footer)
- Headline deve ser premissa ou convite, nunca imperativo
- Máximo 1 CTA por seção
- Sub-texto limita 2 linhas

---

## Referências desta seção

- `dna/identidade-visual/preview/components-buttons.html`
- `dna/identidade-visual/preview/components-cards.html`
- `dna/identidade-visual/preview/components-inputs.html`
- `dna/identidade-visual/preview/components-badges.html`
- `dna/identidade-visual/preview/components-nav-footer.html`
- `dna/identidade-visual/ui_kits/marketing/` — kit de componentes em JSX
