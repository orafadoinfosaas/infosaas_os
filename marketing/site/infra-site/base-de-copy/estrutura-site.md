# Estrutura do Site — Infosaas®

Documento de referência para a arquitetura de páginas, sequência de seções e navegação global do site.

---

## Navegação Global

### Header
- Logo Infosaas® (branco, fundo vinho)
- Nav principal: **Soluções** (dropdown) | **Segmentos** (dropdown) | **O Studio**
- CTA primário: `Falar com a gente →`

**Dropdown Soluções:**
- Consultoria e Implementação → `/solucoes/consultoria`
- Criação de MVPs → `/solucoes/mvp`
- Enterprise → `/solucoes/enterprise`

**Dropdown Segmentos:**
- Educação → `/segmentos/educacao`
- Saúde → `/segmentos/saude`
- Enterprise → `/segmentos/enterprise`

### Footer
- Logo Infosaas® (branco, fundo escuro)
- Tagline: *"Um studio que pensa e cresce junto com o seu negócio."*
- Colunas de links:
  - **Soluções**: MVP Ágil | Consultoria Estratégica | Soluções Enterprise | Soluções Premium
  - **Segmentos**: Educação | Saúde | Enterprise
  - **Infosaas®**: O Studio | Cases | Fale com a gente
- Rodapé: © 2026 Infosaas®. Todos os direitos reservados.

---

## Mapa de Páginas

### Páginas Principais

| Página | Rota | Arquivo de Copy | Status |
|--------|------|-----------------|--------|
| Home | `/` | [page-home.md](page-home.md) | ✅ Construído |

### Soluções

| Página | Rota | Arquivo de Copy | Status |
|--------|------|-----------------|--------|
| Consultoria e Implementação | `/solucoes/consultoria` | [solucao-consultoria.md](solucao-consultoria.md) | ✅ Construído |
| Criação de MVPs | `/solucoes/mvp` | [solucao-mvp.md](solucao-mvp.md) | ✅ Construído |
| Soluções Enterprise | `/solucoes/enterprise` | [solucao-enterprise.md](solucao-enterprise.md) | ✅ Construído |
| Soluções Premium | `/solucoes/premium` | — | — |

### Segmentos

| Página | Rota | Arquivo de Copy | Status |
|--------|------|-----------------|--------|
| Educação | `/segmentos/educacao` | [segmento-educacao.md](segmento-educacao.md) | ✅ Construído |
| Saúde | `/segmentos/saude` | [segmento-saude.md](segmento-saude.md) | ✅ Construído |
| Enterprise | `/segmentos/enterprise` | [segmento-enterprise.md](segmento-enterprise.md) | ✅ Construído |

### Institucional

| Página | Rota | Arquivo de Copy | Status |
|--------|------|-----------------|--------|
| O Studio | `/studio` | [page-studio.md](page-studio.md) | ✅ Construído |
| Cases | `/cases` | — | — |
| Contato | `/contato` | [page-contato.md](page-contato.md) | ✅ Construído |

---

## Estrutura de Seções por Página

### Home (`/`)
1. Hero — headline + slide de logos de clientes
2. About — barra lateral + headline + corpo + 3 cards com borda laranja
3. Customers — carrossel de logos
4. Soluctions — fundo escuro, 3 cards de produto
5. SocialNumbers — métricas + diferenciais + logo strip
6. CTA — shared

### Segmentos (`/segmentos/*`)
Estrutura padrão aplicada em educacao, saude e enterprise:
1. Hero — eyebrow + headline + subtitle + CTA
2. About — barra lateral + headline + corpo + 3 cards
3. Problems — fundo cinza, barra superior, grid 3×2 de cards com barra lateral laranja
4. SocialNumbers — barra lateral + headline + corpo + diferenciais + métricas + logo strip
5. Soluctions — shared
6. CTA — shared

### Consultoria (`/solucoes/consultoria`)
1. Hero — eyebrow + headline + subtitle + CTA + ticket médio (dot.svg + "A partir de R$ 7.500/mês")
2. About — barra lateral + headline (sem corpo) + 3 cards
3. HowItWorks — 2 colunas: esquerda sticky (headline + CTA), direita 6 step cards com sticky-on-scroll stacking
4. Beneficts — fundo escuro, barra superior, headline, grid 2×3 de cards com checkmark laranja, CTA laranja
5. SocialNumbers — apenas métricas (4 números) + logo strip (sem barra lateral, headline ou diferenciais)
6. CTA — copy específica da página

### MVP (`/solucoes/mvp`)
1. Hero — eyebrow + headline + subtitle + CTA + ticket médio (dot.svg + "A partir de R$ 15.000/mês")
2. About — barra lateral + headline (sem corpo) + 3 cards
3. HowItWorks — 2 colunas: esquerda sticky (headline + CTA), direita **5 step cards** com sticky-on-scroll stacking
4. Beneficts — fundo escuro, barra superior, headline, grid **2×2** de cards com checkmark laranja, CTA laranja
5. SocialNumbers — apenas métricas (4 números) + logo strip
6. CTA — copy específica da página

### Enterprise (`/solucoes/enterprise`)
1. Hero — eyebrow + headline + subtitle + CTA + ticket médio (dot.svg + "A partir de R$ 20.000/mês")
2. About — barra lateral + headline (sem corpo) + 3 cards
3. HowItWorks — 2 colunas: esquerda sticky (headline + CTA), direita **5 step cards** com sticky-on-scroll stacking
4. Beneficts — fundo escuro, barra superior, headline, grid **2×2** de cards com checkmark laranja, CTA laranja
5. SocialNumbers — apenas métricas (4 números) + logo strip
6. CTA — copy específica da página

### Contato (`/contato`)
1. FormContato — **2 colunas full-height**: esquerda branca (eyebrow + headline + subtitle + email), direita vinho (formulário com 7 campos + checkbox + botão)
  - Campos: Nome completo, Email, WhatsApp, Solução de interesse (select), Segmento (select), Empresa, Desafio (textarea)
  - Sem lógica de envio por enquanto

### O Studio (`/studio`)
1. Hero — headline + subtitle + CTA único + logo strip (mesmo da Home)
2. About — **2 colunas**: esquerda (barra lateral + headline + corpo), direita (4 bullet points com checkmark laranja)
3. Founders — **seção nova**: fundo cinza, barra superior alinhada à esquerda, headline + subtitle, grid 2×1 de cards com borda laranja + foto + nome + cargo + bio
4. SocialNumbers — igual à Home (barra lateral mono + aspas + headline + body + 3 diferenciais + 4 métricas)
5. CTA — shared (`sections/shared/CTA.astro`)

---

## Componentes Globais Reutilizáveis

- **Header** — fixo em todas as páginas
- **Footer** — fixo em todas as páginas
- **Soluctions** — seção de cards de produto, shared (`sections/shared/Soluctions.astro`)
- **CTA** — "O próximo passo começa com uma conversa.", shared (`sections/shared/CTA.astro`) — páginas podem ter CTA próprio com copy diferente
- **Barra decorativa laranja** (`/barra-superior.svg`) — elemento visual de abertura de seção
- **Barra lateral vertical** (`/barra-lateral-vertical.svg`, `/barra-lateral-vertical-mono.svg`) — abertura de seção About e SocialNumbers
- **Barra lateral card** (`/barra-lateral-card.svg`) — elemento decorativo nos cards de Problems
- **Dot laranja** (`/dot.svg`) — ícone de ticket médio no hero de produto
- **Cards com borda laranja** — padrão em fundo claro (About, Problems)
- **Cards em fundo escuro** — padrão `#1A1A1A` com borda sutil (Beneficts, Soluctions)

---

## Organização de Arquivos

```
src/
  components/
    Header.astro
    Footer.astro
    sections/
      home/         → Hero, About, Customers, SocialNumbers
      shared/       → Soluctions, CTA
      educacao/     → Hero, About, Problems, SocialNumbers
      saude/        → Hero, About, Problems, SocialNumbers
      enterprise/   → Hero, About, Problems, SocialNumbers
      consultoria/  → Hero, About, HowItWorks, Beneficts, SocialNumbers, CTA
      mvp/          → Hero, About, HowItWorks, Beneficts, SocialNumbers, CTA
      enterprise-sol/ → Hero, About, HowItWorks, Beneficts, SocialNumbers, CTA
      studio/         → Hero, About, Founders, SocialNumbers
      contato/        → FormContato
  pages/
    index.astro
    segmentos/
      educacao.astro
      saude.astro
      enterprise.astro
    solucoes/
      consultoria.astro
      mvp.astro
      enterprise.astro
    studio.astro
    contato.astro
```
