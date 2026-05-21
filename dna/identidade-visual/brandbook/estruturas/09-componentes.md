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

- Sticky, fundo branco-off + borda hairline inferior
- Logo esquerda, nav centro/direita, CTA rightmost
- Dropdown: `--shadow-lg`, fundo branco, raio `--radius-lg`
- Mobile: hambúrguer (`Menu` icon Lucide) → drawer lateral ou overlay

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
